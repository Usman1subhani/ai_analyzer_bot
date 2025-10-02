import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EnhancementResult {
  originalText: string;
  enhancedText: string;
  improvements: string[];
  suggestions: string[];
}

@Injectable()
export class EnhancementService {
  private readonly logger = new Logger(EnhancementService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string =
    'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService: ConfigService) {
    const groqConfig = this.configService.get('groq');
    this.apiKey = groqConfig?.apiKey || '';

    if (!this.apiKey) {
      this.logger.error('GROQ_API_KEY is not configured');
      throw new Error('GROQ_API_KEY is required');
    }

    this.logger.log('Enhancement service initialized');
  }

  private createEnhancementPrompt(
    userPrompt: string,
    textToEnhance: string,
  ): string {
    return `
USER REQUEST: "${userPrompt}"

TEXT TO ENHANCE:
${textToEnhance}

INSTRUCTIONS:
1. Understand what the user wants (enhance, rewrite, improve, make professional, etc.)
2. Provide an enhanced version of their text
3. List specific improvements made
4. Give suggestions for further refinement

RETURN THIS EXACT JSON FORMAT - NO OTHER TEXT:

{
  "originalText": "${textToEnhance.replace(/"/g, '\\"')}",
  "enhancedText": "The enhanced/improved version of their text based on their request",
  "improvements": [
    "Specific improvement 1 you made",
    "Specific improvement 2 you made", 
    "Specific improvement 3 you made"
  ],
  "suggestions": [
    "Suggestion 1 for further improvement",
    "Suggestion 2 for further improvement",
    "Suggestion 3 for further improvement"
  ]
}

GUIDELINES:
- Keep enhanced text similar in length to original
- Maintain the original intent and meaning
- Use professional language appropriate for CVs
- Focus on action verbs and quantifiable achievements
- Make it ATS-friendly
- Be specific about what you improved
`;
  }

  async enhanceText(
    userPrompt: string,
    textToEnhance: string,
  ): Promise<EnhancementResult> {
    try {
      this.logger.log('Starting text enhancement...');
      this.logger.debug('User prompt:', userPrompt);
      this.logger.debug('Text length:', textToEnhance.length);

      const prompt = this.createEnhancementPrompt(
        userPrompt,
        textToEnhance.substring(0, 4000),
      );

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log('Enhancement response received successfully');

      const aiResponse = response.data.choices[0].message.content;
      const parsedResult = JSON.parse(aiResponse);

      return this.validateEnhancementResponse(parsedResult, textToEnhance);
    } catch (error) {
      this.logger.error(
        'Enhancement API Error:',
        error.response?.data || error.message,
      );
      throw new Error(`Text enhancement failed: ${error.message}`);
    }
  }

  private validateEnhancementResponse(
    parsedResult: any,
    originalText: string,
  ): EnhancementResult {
    if (
      !parsedResult.enhancedText ||
      !Array.isArray(parsedResult.improvements)
    ) {
      throw new Error('AI returned invalid enhancement response format');
    }

    return {
      originalText: originalText.substring(0, 1000), // Keep original for reference
      enhancedText: parsedResult.enhancedText,
      improvements: parsedResult.improvements,
      suggestions: parsedResult.suggestions || [],
    };
  }
}
