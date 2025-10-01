import { Injectable, BadRequestException } from '@nestjs/common';
import { FileParserService } from './file-parser.service';
import { AnalysisResult, GeminiService } from '../ai/gimini.service';

@Injectable()
export class CvService {
  constructor(
    private readonly fileParserService: FileParserService,
    private readonly aiService: GeminiService, // Changed from AIService to GeminiService
  ) {}

  async analyzeCV(file: Express.Multer.File): Promise<AnalysisResult> {
    try {
      console.log('Extracting text from file...');
      const cvText = await this.fileParserService.extractTextFromFile(file);

      if (!cvText || cvText.trim().length < 50) {
        throw new BadRequestException(
          'CV text is too short or empty. Please upload a valid CV.',
        );
      }

      console.log('CV Text extracted, length:', cvText.length);
      const analysisResult = await this.aiService.analyzeCV(cvText);

      return analysisResult;
    } catch (error) {
      console.error('CV Analysis Error:', error);
      throw new BadRequestException(`CV analysis failed: ${error.message}`);
    }
  }

  async analyzeCVText(cvText: string): Promise<AnalysisResult> {
    if (!cvText || cvText.trim().length < 50) {
      throw new BadRequestException(
        'CV text is too short. Minimum 50 characters required.',
      );
    }

    return await this.aiService.analyzeCV(cvText);
  }
}
