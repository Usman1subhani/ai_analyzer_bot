import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ProfileScraperService,
  ScrapedProfile,
} from '../scrapper/profile-scraper.service';

export interface ProfileAnalysisResult {
  platform: string;
  overallAssessment: string;
  seoScore: number;
  improvements: string[];
  optimizedTitle: string;
  optimizedDescription: string;
  optimizedTags: string[];
  optimizedPricing: string;
  optimizedQA: string[];
  originalData?: ScrapedProfile;
}

@Injectable()
export class ProfileAnalyzerService {
  private readonly logger = new Logger(ProfileAnalyzerService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string =
    'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private configService: ConfigService,
    private profileScraper: ProfileScraperService,
  ) {
    const groqConfig = this.configService.get('groq');
    this.apiKey = groqConfig?.apiKey || '';

    if (!this.apiKey) {
      this.logger.error('GROQ_API_KEY is not configured');
      throw new Error('GROQ_API_KEY is required');
    }

    this.logger.log('Profile Analyzer service initialized');
  }

  // Method for analyzing from URL
  async analyzeProfileByUrl(
    profileUrl: string,
  ): Promise<ProfileAnalysisResult> {
    try {
      this.logger.log(`Analyzing profile from URL: ${profileUrl}`);

      const scrapedData = await this.profileScraper.scrapeProfile(profileUrl);
      return await this.analyzeScrapedProfile(scrapedData);
    } catch (error) {
      this.logger.error('Profile analysis by URL failed:', error.message);
      // Surface scraping error directly
      throw new Error(`Profile scraping failed: ${error.message}`);
    }
  }

  // Method for analyzing from text input
  async analyzeProfileFromText(
    platform: string,
    profileContent: string,
  ): Promise<ProfileAnalysisResult> {
    try {
      this.logger.log(`Analyzing ${platform} profile from text`);

      // Create a mock scraped profile from text input
      const mockScrapedData: ScrapedProfile = {
        platform: platform,
        title: this.extractTitle(profileContent),
        description: this.extractDescription(profileContent),
        tags: this.extractTags(profileContent),
        pricing: this.extractPricing(profileContent),
        skills: this.extractSkills(profileContent),
        experience: '',
        rating: '',
        reviews: '',
        rawContent: profileContent,
      };

      return await this.analyzeScrapedProfile(mockScrapedData);
    } catch (error) {
      this.logger.error('Profile analysis from text failed:', error.message);
      throw new Error(`Profile analysis failed: ${error.message}`);
    }
  }

  private async analyzeScrapedProfile(
    scrapedData: ScrapedProfile,
  ): Promise<ProfileAnalysisResult> {
    const prompt = this.createAnalysisPrompt(scrapedData);

    const response = await axios.post(
      this.apiUrl,
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
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

    const aiResponse = response.data.choices[0].message.content;
    const parsedResult = JSON.parse(aiResponse);

    return {
      ...this.validateProfileResponse(parsedResult, scrapedData.platform),
      originalData: scrapedData,
    };
  }

  private createAnalysisPrompt(scrapedData: ScrapedProfile): string {
    return `
PLATFORM: ${scrapedData.platform.toUpperCase()}

SCRAPED PROFILE DATA:
- Title: ${scrapedData.title}
- Description: ${scrapedData.description}
- Tags: ${scrapedData.tags.join(', ')}
- Pricing: ${scrapedData.pricing}
- Skills: ${scrapedData.skills.join(', ')}
- Experience: ${scrapedData.experience}
- Rating: ${scrapedData.rating}
- Reviews: ${scrapedData.reviews}
- Raw Content: ${scrapedData.rawContent.substring(0, 3000)}

ANALYZE THIS PROFILE AND PROVIDE SEO OPTIMIZATION SUGGESTIONS.

RETURN THIS EXACT JSON FORMAT:
{
  "platform": "${scrapedData.platform}",
  "overallAssessment": "Brief assessment based on actual profile content",
  "seoScore": 7,
  "improvements": ["Specific issue 1", "Specific issue 2", "Specific issue 3", "Quick win"],
  "optimizedTitle": "SEO-optimized title based on their actual title",
  "optimizedDescription": "SEO-optimized description based on their actual content",
  "optimizedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "optimizedPricing": "Pricing suggestion based on their current pricing",
  "optimizedQA": ["Q&A 1", "Q&A 2", "Q&A 3"]
}

Focus on improving what's actually there, not generic advice.
`;
  }

  private validateProfileResponse(
    parsedResult: any,
    platform: string,
  ): Omit<ProfileAnalysisResult, 'originalData'> {
    if (
      !parsedResult.overallAssessment ||
      !Array.isArray(parsedResult.improvements)
    ) {
      throw new Error('AI returned invalid profile analysis response format');
    }

    return {
      platform: platform,
      overallAssessment: parsedResult.overallAssessment,
      seoScore:
        typeof parsedResult.seoScore === 'number'
          ? Math.min(Math.max(parsedResult.seoScore, 1), 10)
          : 7.0,
      improvements: parsedResult.improvements,
      optimizedTitle: parsedResult.optimizedTitle || '',
      optimizedDescription: parsedResult.optimizedDescription || '',
      optimizedTags: parsedResult.optimizedTags || [],
      optimizedPricing: parsedResult.optimizedPricing || '',
      optimizedQA: parsedResult.optimizedQA || [],
    };
  }

  // Helper methods for text analysis
  private extractTitle(content: string): string {
    const lines = content.split('\n');
    return lines[0]?.substring(0, 100) || 'Profile Title';
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    return (
      lines.slice(1, 3).join(' ').substring(0, 200) || 'Profile Description'
    );
  }

  private extractTags(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const commonTags = [
      'web',
      'design',
      'development',
      'seo',
      'marketing',
      'graphic',
      'video',
      'writing',
      'translation',
    ];
    return commonTags
      .filter((tag) => content.toLowerCase().includes(tag))
      .slice(0, 5);
  }

  private extractPricing(content: string): string {
    const priceMatch = content.match(/\$(\d+)/);
    return priceMatch ? `$${priceMatch[1]}` : 'Not specified';
  }

  private extractSkills(content: string): string[] {
    const skills = [
      'javascript',
      'react',
      'node',
      'python',
      'html',
      'css',
      'php',
      'wordpress',
    ];
    return skills
      .filter((skill) => content.toLowerCase().includes(skill))
      .slice(0, 5);
  }
}
