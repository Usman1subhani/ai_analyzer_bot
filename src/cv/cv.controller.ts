import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvService } from './cv.service';
import { AnalysisResult } from '../ai/gimini.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `cv-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedExtensions = ['.pdf', '.docx', '.txt'];
        const fileExtension = extname(file.originalname).toLowerCase();

        console.log(
          'File received:',
          file.originalname,
          'Extension:',
          fileExtension,
        );

        if (allowedExtensions.includes(fileExtension)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Only ${allowedExtensions.join(', ')} files are allowed. Received: ${fileExtension}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnalysisResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log('File successfully uploaded:', file.originalname);
    return await this.cvService.analyzeCV(file);
  }

  @Post('analyze-text')
  async analyzeText(@Body() body: { text: string }): Promise<AnalysisResult> {
    const { text } = body;

    if (!text) {
      throw new BadRequestException('Text is required');
    }

    console.log('Text analysis requested, length:', text.length);
    return await this.cvService.analyzeCVText(text);
  }
}
