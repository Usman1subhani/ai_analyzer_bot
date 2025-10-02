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
import { AnalysisResult } from '../ai/groq.service'; // Use Groq service
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

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

        console.log('📁 File upload attempt:', {
          originalname: file.originalname,
          extension: fileExtension,
          mimetype: file.mimetype,
          size: file.size,
        });

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

    console.log('✅ File successfully received by controller:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      bufferExists: !!file.buffer,
      bufferLength: file.buffer?.length,
      path: file.path,
    });

    try {
      // Read file from disk since buffer might not be available
      const fileBuffer = fs.readFileSync(file.path);

      // Create file object with buffer
      const fileWithBuffer = {
        originalname: file.originalname,
        buffer: fileBuffer,
        path: file.path,
      };

      const result = await this.cvService.analyzeCV(fileWithBuffer);

      // Clean up: delete the uploaded file after processing
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.log(
          '⚠️ Could not delete temporary file:',
          cleanupError.message,
        );
      }

      return result;
    } catch (error) {
      console.error('❌ Controller error:', error);
      throw error;
    }
  }

  @Post('analyze-text')
  async analyzeText(@Body() body: { text: string }): Promise<AnalysisResult> {
    const { text } = body;

    if (!text) {
      throw new BadRequestException('Text is required');
    }

    console.log('📝 Text analysis requested, length:', text.length);
    return await this.cvService.analyzeCVText(text);
  }
}