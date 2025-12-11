import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectType } from '../project/project.entity';
import { ReviewService } from '../review/review.service';
import { AiService } from '../ai/ai.service';
import { TrainingService } from '../training/training.service';
import { DiscordService } from '../discord/discord.service';
import { ReviewStatus } from '../review/review.entity';
import { CommentType } from '../review/review-comment.entity';
import { Octokit } from '@octokit/rest';
import { Gitlab } from '@gitbeaker/node';
import { User } from '../user/user.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private reviewService: ReviewService,
    private aiService: AiService,
    private trainingService: TrainingService,
    private discordService: DiscordService,
  ) {}

  async handlePullRequestEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      const prData = this.extractPullRequestData(payload, source);

      if (prData.action !== 'opened' && prData.action !== 'synchronize') {
        return;
      }

      // Tìm project tương ứng
      const project = await this.findProjectByRepository(
        prData.repositoryUrl,
        source === 'github' ? ProjectType.GITHUB : ProjectType.GITLAB,
      );

      if (!project || !project.autoReview) {
        this.logger.log('Project not found or auto-review disabled');
        return;
      }

      // Load user for Discord bot token
      await this.projectRepository.manager.getRepository('User').findOne({
        where: { id: project.userId },
      }).then((user: User) => {
        if (user) {
          project.user = user;
        }
      });

      // Tạo review record
      const review = await this.reviewService.createReview({
        projectId: project.id,
        pullRequestId: prData.pullRequestId,
        pullRequestNumber: prData.pullRequestNumber,
        pullRequestTitle: prData.title,
        pullRequestUrl: prData.url,
        branch: prData.branch,
        author: prData.author,
        filesChanged: prData.filesChanged,
      });

      // Send Discord notification
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        await this.discordService.notifyPullRequest({
          projectName: project.name,
          pullRequestTitle: prData.title,
          pullRequestUrl: prData.url,
          author: prData.author,
          branch: prData.branch,
          filesChanged: prData.filesChanged?.length || 0,
          additions: prData.filesChanged?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0,
          deletions: prData.filesChanged?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0,
        }, botToken, project.discordChannelId);
      }

      // Trigger AI review
      await this.performAiReview(review.id, project, prData);
    } catch (error) {
      this.logger.error('Error handling pull request event:', error);
    }
  }

  async handleCommentEvent(payload: any, source: 'github' | 'gitlab') {
    try {
      const commentData = this.extractCommentData(payload, source);

      // Tìm review tương ứng
      const reviews = await this.reviewService.findReviewsByProject(
        commentData.projectId,
      );
      const review = reviews.find(
        (r) => r.pullRequestId === commentData.pullRequestId,
      );

      if (!review) {
        this.logger.log('Review not found for comment');
        return;
      }

      // Lưu comment
      await this.reviewService.createComment({
        reviewId: review.id,
        externalCommentId: commentData.commentId,
        type: CommentType.USER_FEEDBACK,
        content: commentData.content,
        filePath: commentData.filePath,
        lineNumber: commentData.lineNumber,
        author: commentData.author,
        parentCommentId: commentData.parentCommentId,
      });

      // Nếu comment reply AI comment, thì train lại
      if (commentData.isReplyToAi) {
        await this.trainingService.processUserFeedback(
          review.projectId,
          commentData.content,
          commentData.codeSnippet,
          commentData.aiComment,
        );
      }

      // Generate AI reply nếu cần
      const project = await this.projectRepository.findOne({
        where: { id: review.projectId },
        relations: ['user'],
      });

      if (project && commentData.isReplyToAi) {
        const aiReply = await this.aiService.generateReply(
          commentData.content,
          {
            businessContext: project.businessContext,
            reviewRules: project.reviewRules,
            codeSnippet: commentData.codeSnippet,
            fileName: commentData.filePath,
          },
        );

        // Post reply
        await this.postComment(
          project,
          commentData.pullRequestId,
          aiReply,
          commentData.filePath,
          commentData.lineNumber,
          source,
        );

        // Save AI reply
        await this.reviewService.createComment({
          reviewId: review.id,
          externalCommentId: `ai-reply-${Date.now()}`,
          type: CommentType.AI_REPLY,
          content: aiReply,
          filePath: commentData.filePath,
          lineNumber: commentData.lineNumber,
          parentCommentId: commentData.commentId,
        });
      }
    } catch (error) {
      this.logger.error('Error handling comment event:', error);
    }
  }

  private async performAiReview(
    reviewId: string,
    project: Project,
    prData: any,
  ) {
    try {
      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.IN_PROGRESS,
      );

      // Lấy diff của từng file
      const fileContents = await this.fetchFileContents(project, prData);

      const allComments = [];

      for (const file of fileContents) {
        const comments = await this.aiService.reviewCode({
          businessContext: project.businessContext,
          reviewRules: project.reviewRules,
          codeSnippet: file.content,
          fileName: file.filename,
          pullRequestTitle: prData.title,
          pullRequestDescription: prData.description,
        });

        for (const comment of comments) {
          allComments.push({
            file: file.filename,
            comment,
          });

          // Post comment lên GitHub/GitLab
          await this.postComment(
            project,
            prData.pullRequestId,
            comment,
            file.filename,
            null,
            project.type === ProjectType.GITHUB ? 'github' : 'gitlab',
          );

          // Save comment
          await this.reviewService.createComment({
            reviewId,
            externalCommentId: `ai-${Date.now()}-${Math.random()}`,
            type: CommentType.AI_GENERATED,
            content: comment,
            filePath: file.filename,
          });
        }
      }

      // Save analysis
      await this.reviewService.saveReviewAnalysis(reviewId, {
        totalComments: allComments.length,
        reviewedAt: new Date(),
        comments: allComments,
      });

      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.COMPLETED,
      );

      // Send Discord notification for review completion
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        await this.discordService.notifyReviewComplete({
          projectName: project.name,
          pullRequestTitle: prData.title,
          pullRequestUrl: prData.url,
          totalComments: allComments.length,
          status: 'success',
        }, botToken, project.discordChannelId);
      }
    } catch (error) {
      this.logger.error('AI review failed:', error);
      await this.reviewService.updateReviewStatus(
        reviewId,
        ReviewStatus.FAILED,
      );

      // Send Discord notification for review failure
      const botToken = project.user?.discordBotToken;
      if (this.discordService.isEnabled(botToken) && project.discordChannelId && botToken) {
        const review = await this.reviewService.findReviewById(reviewId);
        await this.discordService.notifyReviewComplete({
          projectName: project.name,
          pullRequestTitle: review?.pullRequestTitle || 'Unknown',
          pullRequestUrl: review?.pullRequestUrl || '',
          totalComments: 0,
          status: 'failed',
        }, botToken, project.discordChannelId);
      }
    }
  }

  private async fetchFileContents(project: Project, prData: any) {
    // TODO: Implement fetch file contents từ GitHub/GitLab API
    // Mock data
    return prData.filesChanged.map((file) => ({
      filename: file.filename,
      content: `// Mock content for ${file.filename}`,
    }));
  }

  private async postComment(
    project: Project,
    pullRequestId: string,
    comment: string,
    filePath: string,
    lineNumber: number | null,
    source: 'github' | 'gitlab',
  ) {
    try {
      if (source === 'github') {
        const octokit = new Octokit({
          auth: project.user.githubToken,
        });

        // Parse repository URL
        const [owner, repo] = this.parseGithubUrl(project.repositoryUrl);

        await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: parseInt(pullRequestId),
          body: comment,
          path: filePath,
          ...(lineNumber && { line: lineNumber }),
          side: 'RIGHT',
          commit_id: 'HEAD',
        });
      } else if (source === 'gitlab') {
        const api = new Gitlab({
          token: project.user.gitlabToken,
        });

        // Parse project ID
        const projectId = this.parseGitlabUrl(project.repositoryUrl);

        await api.MergeRequestNotes.create(
          projectId,
          parseInt(pullRequestId),
          comment,
        );
      }
    } catch (error) {
      this.logger.error('Failed to post comment:', error);
    }
  }

  private extractPullRequestData(payload: any, source: 'github' | 'gitlab') {
    if (source === 'github') {
      return {
        action: payload.action,
        pullRequestId: payload.pull_request.id.toString(),
        pullRequestNumber: payload.pull_request.number,
        title: payload.pull_request.title,
        description: payload.pull_request.body,
        url: payload.pull_request.html_url,
        branch: payload.pull_request.head.ref,
        author: payload.pull_request.user.login,
        repositoryUrl: payload.repository.html_url,
        filesChanged: payload.pull_request.changed_files || [],
      };
    } else {
      return {
        action: payload.object_attributes.action,
        pullRequestId: payload.object_attributes.iid.toString(),
        pullRequestNumber: payload.object_attributes.iid,
        title: payload.object_attributes.title,
        description: payload.object_attributes.description,
        url: payload.object_attributes.url,
        branch: payload.object_attributes.source_branch,
        author: payload.user.username,
        repositoryUrl: payload.project.web_url,
        filesChanged: [],
      };
    }
  }

  private extractCommentData(payload: any, source: 'github' | 'gitlab') {
    // TODO: Implement comment data extraction
    return {
      projectId: '',
      pullRequestId: '',
      commentId: '',
      content: '',
      filePath: '',
      lineNumber: null,
      author: '',
      parentCommentId: null,
      isReplyToAi: false,
      codeSnippet: '',
      aiComment: '',
    };
  }

  private async findProjectByRepository(url: string, type: ProjectType) {
    return await this.projectRepository.findOne({
      where: { repositoryUrl: url, type },
      relations: ['user'],
    });
  }

  private parseGithubUrl(url: string): [string, string] {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return [match[1], match[2]];
  }

  private parseGitlabUrl(url: string): string {
    // Extract project ID or path from GitLab URL
    const match = url.match(/gitlab\.com\/(.+)/);
    if (!match) throw new Error('Invalid GitLab URL');
    return match[1];
  }
}
