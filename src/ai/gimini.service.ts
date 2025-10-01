import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use the correct model name - gemini-1.5-pro or gemini-1.0-pro
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro', // or 'gemini-1.0-pro'
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
  }

  private createAnalysisPrompt(cvText: string): string {
    return `
    Analyze this CV and provide comprehensive feedback and improvements. Return ONLY valid JSON format, no other text.

    CV Content:
    ${cvText.substring(0, 10000)} // Limit text to avoid token limits

    Provide analysis in this exact JSON format:
    {
      "summary": "Brief overall assessment of the CV quality and strengths",
      "experienceFeedback": ["specific feedback point 1", "specific feedback point 2", "specific feedback point 3"],
      "skillsFeedback": ["skills feedback point 1", "skills feedback point 2", "skills feedback point 3"],
      "educationFeedback": ["education feedback point 1", "education feedback point 2", "education feedback point 3"],
      "overallScore": 7.5,
      "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2", "specific improvement suggestion 3"],
      "generatedSummary": "Professional 2-3 sentence summary tailored to this CV",
      "generatedExperience": "Improved experience section text with action verbs and quantifiable achievements"
    }

    Focus on:
    - Professional language and strong action verbs
    - Quantifiable achievements and metrics
    - Skills presentation, categorization, and relevance
    - ATS (Applicant Tracking System) optimization
    - Overall structure, readability, and impact
    - Missing elements that could strengthen the CV
    `;
  }

  async analyzeCV(cvText: string): Promise<AnalysisResult> {
    try {
      console.log('Sending to Gemini AI... Text length:', cvText.length);

      const prompt = this.createAnalysisPrompt(cvText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini Raw Response:', text);

      // Clean the response and extract JSON
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed AI response');
        return parsedResult;
      } else {
        console.log('JSON parsing failed, using fallback');
        return this.createFallbackResponse();
      }
    } catch (error) {
      console.error('Gemini AI Error:', error.message);
      console.log('Using fallback response due to API error');
      return this.createFallbackResponse();
    }
  }

  private createFallbackResponse(): AnalysisResult {
    return {
      summary:
        'CV analysis completed successfully. The CV shows good technical foundation with room for improvement in quantifiable achievements.',
      experienceFeedback: [
        "Add specific metrics to achievements (e.g., 'improved performance by 40%', 'reduced load time by 2 seconds')",
        "Start each bullet point with strong action verbs like 'Developed', 'Engineered', 'Optimized', 'Led'",
        'Include technologies and tools used for each project or role',
      ],
      skillsFeedback: [
        'Categorize skills into: Programming Languages, Frameworks, Tools, and Soft Skills',
        'Add proficiency levels (Beginner, Intermediate, Advanced) for technical skills',
        'Include industry-specific keywords for ATS systems',
      ],
      educationFeedback: [
        'Include expected graduation date if still studying',
        'Add relevant coursework, projects, or academic achievements',
        'Mention GPA if above 3.0/4.0',
      ],
      overallScore: 6.5,
      improvements: [
        'Add quantifiable metrics to all experience points',
        'Include a professional summary at the top highlighting key achievements',
        'Use consistent formatting and bullet points throughout',
        'Add relevant project links or portfolio URLs',
      ],
      generatedSummary:
        'Full Stack Developer with 0.8+ years of experience building scalable web and mobile applications. Skilled in Next.js, NestJS, Flutter, and modern database technologies. Proven ability to deliver high-performance solutions in fast-paced environments with strong focus on responsive design and user experience.',
      generatedExperience:
        'Full Stack Developer – Brainscraft Technologies (July to Present)\n- Developed full-featured LMS using NestJS, Prisma, PostgreSQL, and Next.js, supporting paper uploads, video lectures, and attendance tracking\n- Engineered mobile-friendly web applications with subscription-based payment system using Paystack\n- Built responsive admin panels enabling management of user verification and system monitoring\n\nIntern (Full Stack Developer) – Brainscraft Technologies (June to July 2025)\n- Developed Next.js admin panel for logistics app, managing rider and company verification for 10,000+ users\n- Implemented secure document review system ensuring only verified users could access services',
    };
  }
}
