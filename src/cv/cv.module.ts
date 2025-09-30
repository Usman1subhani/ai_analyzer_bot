import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  providers: [CvService],
  controllers: [CvController]
})
export class CvModule {}
