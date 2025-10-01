import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { FileParserService } from './file-parser.service';
import { GroqService } from '../ai/groq.service';

@Module({
  controllers: [CvController],
  providers: [CvService, FileParserService, GroqService],
})
export class CvModule {}
