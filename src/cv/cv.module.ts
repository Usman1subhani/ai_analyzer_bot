import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { FileParserService } from './file-parser.service';
import { GeminiService } from '../ai/gimini.service';

@Module({
  providers: [CvService, FileParserService, GeminiService],
  controllers: [CvController],
})
export class CvModule {}
