import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  ProfileAnalyzerService,
  ProfileAnalysisResult,
} from '../ai/profile-analyzer.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileAnalyzerService: ProfileAnalyzerService,
  ) {}

  @Post('analyze-url')
  async analyzeProfileByUrl(
    @Body() body: { profileUrl: string },
  ): Promise<ProfileAnalysisResult> {
    const { profileUrl } = body;

    if (!profileUrl) {
      throw new BadRequestException('profileUrl is required');
    }

    if (!this.isValidUrl(profileUrl)) {
      throw new BadRequestException(
        'Invalid URL format or unsupported platform',
      );
    }

    console.log('🔍 Profile URL analysis request:', { profileUrl });

    try {
      return await this.profileAnalyzerService.analyzeProfileByUrl(profileUrl);
    } catch (error) {
      // If scraping or analysis fails, return a clear error to the user
      throw new BadRequestException(
        error?.message || 'Profile scraping or analysis failed',
      );
    }
  }

  @Post('analyze')
  async analyzeProfileByText(
    @Body() body: { platform: string; profileContent: string },
  ): Promise<ProfileAnalysisResult> {
    const { platform, profileContent } = body;

    if (!platform || !profileContent) {
      throw new BadRequestException(
        'Both platform and profileContent are required',
      );
    }

    if (
      !['fiverr', 'upwork', 'linkedin', 'freelancer'].includes(
        platform.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'Platform must be: fiverr, upwork, linkedin, or freelancer',
      );
    }

    if (profileContent.trim().length < 50) {
      throw new BadRequestException(
        'Profile content must be at least 50 characters long',
      );
    }

    console.log('🔍 Profile analysis request:', {
      platform: platform.toLowerCase(),
      contentLength: profileContent.length,
    });

    // Call the correct method name - it should be analyzeScrapedProfile or analyzeProfile
    // Since we're analyzing text, let's create a method for that
    return await this.profileAnalyzerService.analyzeProfileFromText(
      platform,
      profileContent,
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return (
        url.includes('fiverr.com') ||
        url.includes('upwork.com') ||
        url.includes('linkedin.com') ||
        url.includes('freelancer.com')
      );
    } catch {
      return false;
    }
  }
}
