import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AnalysisResult {
  summary: string;
  experienceFeedback: string[];
  skillsFeedback: string[];
  educationFeedback: string[];
  overallScore: number;
  improvements: string[];
  generatedSummary: string;
  generatedExperience: string;
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string =
    'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService: ConfigService) {
    // Get from configuration
    const groqConfig = this.configService.get('groq');
    this.apiKey = groqConfig?.apiKey || '';

    // Or get directly from environment
    // this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.error('GROQ_API_KEY is not configured');
      throw new Error('GROQ_API_KEY is required');
    }

    this.logger.log('Groq AI service initialized');
  }

  private createAnalysisPrompt(cvText: string): string {
    return `
    You are an expert CV analyzer and career coach. Analyze the following CV thoroughly and provide specific, tailored feedback.

    CV CONTENT:
    ${cvText}

    IMPORTANT: Return your analysis in EXACTLY this JSON format - no other text, no explanations:

    {
      "summary": "Brief overall assessment of this specific CV's quality, strengths and weaknesses based on the actual content",
      "experienceFeedback": ["First specific feedback point about THEIR experience section", "Second specific point", "Third specific point"],
      "skillsFeedback": ["First specific feedback about THEIR skills section", "Second specific point", "Third specific point"],
      "educationFeedback": ["First specific feedback about THEIR education section", "Second specific point", "Third specific point"],
      "overallScore": A number from 1 to 10 rating THIS CV's overall quality based on its actual content,
      "improvements": ["First specific improvement suggestion for THIS CV", "Second specific suggestion", "Third specific suggestion"],
      "generatedSummary": "A professional 2-3 sentence summary created specifically for this person based on their actual experience and skills",
      "generatedExperience": "An improved version of THEIR specific experience section using action verbs and quantifiable achievements based on their actual work history"
    }

    CRITICAL GUIDELINES:
    1. Analyze THIS specific CV content - don't give generic advice
    2. If they mention specific technologies, projects, or achievements, reference them
    3. Tailor all feedback to their actual background and experience level
    4. If they're a student, give student-appropriate feedback
    5. If they're senior, give senior-level feedback
    6. Base the generated summary and experience on THEIR actual content
    7. Make all feedback specific and actionable for THIS person

    Focus on what's actually in their CV, not generic advice.
    `;
  }

  async analyzeCV(cvText: string): Promise<AnalysisResult> {
    try {
      this.logger.log('Starting Groq AI analysis...');
      this.logger.debug('CV text length:', cvText.length);

      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

      const prompt = this.createAnalysisPrompt(cvText.substring(0, 12000)); // Limit text length

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'llama-3.1-8b-instant', // Fast and free model
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      this.logger.log('Groq API response received successfully');

      const aiResponse = response.data.choices[0].message.content;
      this.logger.debug('Raw AI response:', aiResponse);

      // Parse JSON response
      const parsedResult = JSON.parse(aiResponse);

      // Validate the response structure
      return this.validateResponse(parsedResult);
    } catch (error) {
      this.logger.error(
        'Groq API Error:',
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        throw new Error(
          'Invalid Groq API key. Please check your configuration.',
        );
      } else if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 402) {
        throw new Error(
          'Insufficient API credits. Please check your Groq account.',
        );
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('API request timeout. Please try again.');
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  private validateResponse(parsedResult: any): AnalysisResult {
    // Only validate structure, don't provide fallback content
    // This ensures we only return real AI analysis
    if (
      !parsedResult.summary ||
      !Array.isArray(parsedResult.experienceFeedback)
    ) {
      throw new Error('AI returned invalid response format');
    }

    return {
      summary: parsedResult.summary,
      experienceFeedback: parsedResult.experienceFeedback,
      skillsFeedback: parsedResult.skillsFeedback,
      educationFeedback: parsedResult.educationFeedback,
      overallScore:
        typeof parsedResult.overallScore === 'number'
          ? Math.min(Math.max(parsedResult.overallScore, 1), 10)
          : 7.0,
      improvements: parsedResult.improvements,
      generatedSummary: parsedResult.generatedSummary,
      generatedExperience: parsedResult.generatedExperience,
    };
  }
} // <-- This closing bracket was missing
