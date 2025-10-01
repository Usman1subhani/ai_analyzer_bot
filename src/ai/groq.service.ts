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

    if (!this.apiKey) {
      this.logger.error('GROQ_API_KEY is not configured');
      throw new Error('GROQ_API_KEY is required');
    }

    this.logger.log('Groq AI service initialized');
  }

  private createAnalysisPrompt(cvText: string): string {
    return `
CRITICAL: You are a professional CV analyst. Analyze this CV in detail and provide SPECIFIC, CONCISE feedback. Be direct and to the point.

CV TO ANALYZE:
${cvText}

ANALYSIS REQUIREMENTS:
1. Read the ENTIRE CV carefully - every section matters
2. Score out of 10 based on: content quality, structure, relevance, impact
3. For each section, give 2-3 SPECIFIC feedback points
4. Improvements must be ACTIONABLE and SPECIFIC to this CV
5. Keep all responses SHORT and POINT-FORM
6. No generic advice - only what applies to THIS CV

RETURN THIS EXACT JSON FORMAT - NO OTHER TEXT:

{
  "summary": "One sentence overall assessment focusing on main strengths and weaknesses",
  "experienceFeedback": [
    "Specific issue 1 in experience section",
    "Specific issue 2 in experience section", 
    "Missing or weak element in experience"
  ],
  "skillsFeedback": [
    "Specific skills section problem 1",
    "Specific skills section problem 2",
    "Missing skills or categorization issue"
  ],
  "educationFeedback": [
    "Specific education section issue 1", 
    "Specific education section issue 2",
    "Missing education information"
  ],
  "overallScore": 7,
  "improvements": [
    "Most critical fix needed (e.g., 'Add metrics to 2nd experience bullet')",
    "Second most important improvement", 
    "Third priority improvement",
    "Quick win improvement"
  ],
  "generatedSummary": "2-sentence professional summary based on their actual experience",
  "generatedExperience": "Improved version of ONE key experience bullet point with action verbs"
}

SECTION ANALYSIS FOCUS:

EXPERIENCE: Check each job/role for:
- Action verbs vs passive language
- Quantifiable achievements (numbers, percentages, results)
- Missing technologies or tools used
- Relevance to target roles
- Chronological order and gaps

SKILLS: Check for:
- Categorization (technical, soft, tools)
- Missing relevant skills for their industry
- Outdated or irrelevant skills
- Proficiency levels if mentioned
- ATS optimization

EDUCATION: Check for:
- Missing dates or institutions
- Relevant coursework/projects
- Academic achievements
- Certifications if applicable

SCORING GUIDE:
10 = Perfect, needs no changes
8-9 = Excellent, minor tweaks needed
6-7 = Good, several improvements needed
4-5 = Average, major revisions needed
1-3 = Poor, complete overhaul needed

BE SPECIFIC: Instead of "add metrics" say "Add percentage to 3rd experience bullet about project success"
BE CONCISE: Maximum 10 words per feedback point
BE DIRECT: Point to exact sections that need work
`;
  }

  async analyzeCV(cvText: string): Promise<AnalysisResult> {
    try {
      this.logger.log('Starting Groq AI analysis...');
      this.logger.debug('CV text length:', cvText.length);

      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

      const prompt = this.createAnalysisPrompt(cvText.substring(0, 12000));

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
          max_tokens: 2000,
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

      this.logger.log('Groq API response received successfully');

      const aiResponse = response.data.choices[0].message.content;
      this.logger.debug('Raw AI response:', aiResponse);

      const parsedResult = JSON.parse(aiResponse);
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
}
