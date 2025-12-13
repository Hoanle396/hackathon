import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('webhook')
@ApiTags('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received GitHub webhook: ${event}`);

    if (!event) {
      throw new BadRequestException('Missing GitHub event header');
    }

    // TODO: Verify webhook signature

    if (event === 'pull_request') {
      await this.webhookService.handlePullRequestEvent(payload, 'github');
    } else if (event === 'pull_request_review_comment' || event === 'issue_comment') {
      // Handle both review comments (inline) and issue comments (general PR comments)
      await this.webhookService.handleCommentEvent(payload, 'github');
    } else if (event === 'pull_request_review') {
      // Handle review submissions
      this.logger.log('Review event received but not processing yet');
    } else {
      this.logger.log(`Unhandled GitHub event: ${event}`);
    }

    return { message: 'Webhook processed' };
  }

  @Post('gitlab')
  async handleGitlabWebhook(
    @Headers('x-gitlab-event') event: string,
    @Headers('x-gitlab-token') token: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received GitLab webhook: ${event}`);

    if (!event) {
      throw new BadRequestException('Missing GitLab event header');
    }

    // TODO: Verify webhook token

    if (event === 'Merge Request Hook') {
      await this.webhookService.handlePullRequestEvent(payload, 'gitlab');
    } else if (event === 'Note Hook' || event === 'Comment') {
      // Handle both merge request notes and general comments
      await this.webhookService.handleCommentEvent(payload, 'gitlab');
    } else {
      this.logger.log(`Unhandled GitLab event: ${event}`);
    }

    return { message: 'Webhook processed' };
  }
}
