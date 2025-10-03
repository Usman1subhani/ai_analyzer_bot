import { Injectable, BadRequestException } from '@nestjs/common';
import { FileParserService } from './file-parser.service';
import { GroqService, AnalysisResult } from '../ai/groq.service'; // Use Groq service

@Injectable()
export class CvService {
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Constructor for CvService
 * @param fileParserService - service for extracting text from files
 * @param aiService - service for interacting with Groq AI
 */
/*******  7f6fd12d-0cf5-4b6c-9a9c-76a2aafc82a7  *******/
  constructor(
    private readonly fileParserService: FileParserService,
    private readonly aiService: GroqService, // Use Groq service
  ) {}

  async analyzeCV(file: any): Promise<AnalysisResult> {
    try {
      console.log('=== Starting Real Groq AI CV Analysis ===');

      // Extract text from file
      const cvText = await this.fileParserService.extractTextFromFile(file);

      if (!cvText || cvText.trim().length < 50) {
        throw new BadRequestException(
          'CV text is too short or empty. Please upload a valid CV.',
        );
      }

      console.log('✅ CV Text extracted, length:', cvText.length);
      console.log('🤖 Sending to Groq AI for REAL analysis...');

      // Send to REAL Groq AI for analysis - no hardcoded responses!
      const analysisResult = await this.aiService.analyzeCV(cvText);

      console.log('🎉 Real Groq AI analysis completed successfully');
      return analysisResult;
    } catch (error) {
      console.error('❌ CV Analysis Error:', error);
      throw new BadRequestException(`CV analysis failed: ${error.message}`);
    }
  }

  async analyzeCVText(cvText: string): Promise<AnalysisResult> {
    if (!cvText || cvText.trim().length < 50) {
      throw new BadRequestException(
        'CV text is too short. Minimum 50 characters required.',
      );
    }

    console.log('🤖 Sending text to Groq AI for REAL analysis...');
    return await this.aiService.analyzeCV(cvText);
  }
}
