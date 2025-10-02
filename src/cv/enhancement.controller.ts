import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  EnhancementService,
  EnhancementResult,
} from '../ai/enhancement.service';

@Controller('cv')
export class EnhancementController {
  constructor(private readonly enhancementService: EnhancementService) {}

  @Post('enhance')
  async enhanceText(
    @Body() body: { prompt: string; text: string },
  ): Promise<EnhancementResult> {
    const { prompt, text } = body;

    if (!prompt || !text) {
      throw new BadRequestException('Both prompt and text are required');
    }

    if (text.trim().length < 10) {
      throw new BadRequestException('Text must be at least 10 characters long');
    }

    if (prompt.trim().length < 5) {
      throw new BadRequestException(
        'Prompt must be at least 5 characters long',
      );
    }

    console.log('🎯 Enhancement request:', {
      promptLength: prompt.length,
      textLength: text.length,
      prompt: prompt.substring(0, 100) + '...',
    });

    return await this.enhancementService.enhanceText(prompt, text);
  }
}
