import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainingData,
  TrainingDataType,
} from '../training/training-data.entity';

interface CodeReviewContext {
  businessContext?: string;
  reviewRules?: Record<string, any>;
  codeSnippet: string;
  fileName: string;
  pullRequestTitle?: string;
  pullRequestDescription?: string;
}

interface TrainingExample {
  codeSnippet: string;
  aiComment: string;
  userFeedback?: string;
  correctedComment?: string;
}

@Injectable()
export class AiService {
  private openaiApiKey: string;
  private anthropicApiKey: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TrainingData)
    private trainingDataRepository: Repository<TrainingData>,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
    this.anthropicApiKey = this.configService.get('ANTHROPIC_API_KEY');
  }

  async reviewCode(context: CodeReviewContext): Promise<string[]> {
    const { businessContext, reviewRules, codeSnippet, fileName } = context;

    // Lấy training data liên quan
    const trainingExamples = await this.getRelevantTrainingData(
      context.pullRequestTitle || '',
    );

    const systemPrompt = this.buildSystemPrompt(
      businessContext,
      reviewRules,
      trainingExamples,
    );

    const userPrompt = `
Hãy review đoạn code sau từ file: ${fileName}

\`\`\`
${codeSnippet}
\`\`\`

Yêu cầu:
1. Phân tích kỹ thuật và logic
2. Kiểm tra theo business context đã cung cấp
3. Đề xuất cải thiện cụ thể
4. Chỉ ra lỗi tiềm ẩn và security issues
5. Comment phải súc tích, rõ ràng, và có thể action được

Format: Mỗi issue trên một dòng, bắt đầu bằng emoji tương ứng:
🐛 Bug hoặc lỗi logic
⚠️ Warning hoặc code smell
💡 Suggestion để cải thiện
🔒 Security issue
📝 Business logic issue
`;

    // Gọi AI API (giả lập - bạn cần implement thật với OpenAI hoặc Anthropic)
    const comments = await this.callAiApi(systemPrompt, userPrompt);

    return comments;
  }

  private buildSystemPrompt(
    businessContext?: string,
    reviewRules?: Record<string, any>,
    trainingExamples?: TrainingExample[],
  ): string {
    let prompt = `Bạn là một AI Code Reviewer chuyên nghiệp. Nhiệm vụ của bạn là review code một cách chi tiết, chính xác và hữu ích.

`;

    if (businessContext) {
      prompt += `BUSINESS CONTEXT:
${businessContext}

`;
    }

    if (reviewRules) {
      prompt += `REVIEW RULES:
${JSON.stringify(reviewRules, null, 2)}

`;
    }

    if (trainingExamples && trainingExamples.length > 0) {
      prompt += `HỌC TỪ CÁC REVIEW TRƯỚC:
`;
      trainingExamples.slice(0, 5).forEach((example, index) => {
        prompt += `
Example ${index + 1}:
Code: ${example.codeSnippet}
AI Comment: ${example.aiComment}
`;
        if (example.correctedComment) {
          prompt += `Corrected: ${example.correctedComment}
`;
        }
      });
    }

    return prompt;
  }

  private async getRelevantTrainingData(
    context: string,
  ): Promise<TrainingExample[]> {
    // Lấy training data có positive feedback hoặc corrections
    const trainingData = await this.trainingDataRepository.find({
      where: [
        { type: TrainingDataType.POSITIVE },
        { type: TrainingDataType.CORRECTION },
      ],
      order: { useCount: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    return trainingData.map((data) => ({
      codeSnippet: data.codeSnippet,
      aiComment: data.aiComment,
      userFeedback: data.userFeedback,
      correctedComment: data.correctedComment,
    }));
  }

  private async callAiApi(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string[]> {
    // TODO: Implement thật với OpenAI hoặc Anthropic
    // Đây là mock response

    try {
      // Example với OpenAI (uncomment khi có API key)
      /*
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: this.openaiApiKey });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      });
      
      const response = completion.choices[0].message.content;
      return response.split('\n').filter(line => line.trim());
      */

      // Mock response cho demo
      return [
        '🐛 Thiếu error handling khi gọi API external',
        '⚠️ Function này quá dài, nên chia nhỏ thành các function con',
        '💡 Có thể optimize query bằng cách sử dụng index',
        '🔒 Input không được validate, có thể dẫn đến SQL injection',
      ];
    } catch (error) {
      console.error('AI API call failed:', error);
      return ['⚠️ Không thể analyze code lúc này, vui lòng thử lại sau'];
    }
  }

  async generateReply(
    userComment: string,
    context: CodeReviewContext,
  ): Promise<string> {
    const systemPrompt = `Bạn là AI Code Reviewer. Hãy trả lời comment của user một cách chuyên nghiệp, hữu ích và lịch sự.`;

    const userPrompt = `
User comment: ${userComment}

Code context:
\`\`\`
${context.codeSnippet}
\`\`\`

Hãy đưa ra câu trả lời phù hợp, giải thích rõ ràng nếu cần.
`;

    const replies = await this.callAiApi(systemPrompt, userPrompt);
    return replies.join('\n');
  }
}
