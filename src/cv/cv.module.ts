import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { FileParserService } from './file-parser.service';
import { GroqService } from '../ai/groq.service';
import { EnhancementController } from './enhancement.controller';
import { EnhancementService } from 'src/ai/enhancement.service';

@Module({
  controllers: [CvController, EnhancementController],
  providers: [CvService, FileParserService, GroqService, EnhancementService],
})
export class CvModule {}