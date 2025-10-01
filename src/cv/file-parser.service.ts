import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';

@Injectable()
export class FileParserService {
  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      console.log('🔧 Parsing PDF, buffer size:', buffer.length);

      // Simple text extraction - works for text-based PDFs
      const text = buffer.toString('utf-8');

      // Clean the text
      const cleanText = this.cleanExtractedText(text);

      console.log('📊 PDF parsing result:', {
        originalLength: text.length,
        cleanedLength: cleanText.length,
      });

      if (cleanText.length < 50) {
        throw new Error(
          `Only extracted ${cleanText.length} characters. PDF may be scanned or image-based.`,
        );
      }

      return cleanText;
    } catch (error) {
      console.error('❌ PDF parsing failed:', error.message);
      throw new Error(
        `PDF parsing failed: ${error.message}. Try converting to DOCX format.`,
      );
    }
  }

  async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      console.log('🔧 Parsing DOCX, buffer size:', buffer.length);

      const result = await mammoth.extractRawText({ buffer });

      if (!result.value) {
        throw new Error('No text content found in DOCX file');
      }

      const cleanText = this.cleanExtractedText(result.value);

      console.log('📊 DOCX parsing result:', {
        originalLength: result.value.length,
        cleanedLength: cleanText.length,
      });

      if (cleanText.length < 50) {
        throw new Error(
          `Only extracted ${cleanText.length} characters. File may be empty.`,
        );
      }

      return cleanText;
    } catch (error) {
      console.error('❌ DOCX parsing failed:', error.message);
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  async parseText(buffer: Buffer): Promise<string> {
    try {
      console.log('🔧 Parsing TEXT, buffer size:', buffer.length);

      const text = buffer.toString('utf-8');
      const cleanText = this.cleanExtractedText(text);

      console.log('📊 TEXT parsing result:', {
        originalLength: text.length,
        cleanedLength: cleanText.length,
      });

      if (cleanText.length < 50) {
        throw new Error(
          `Only extracted ${cleanText.length} characters. File is too short.`,
        );
      }

      return cleanText;
    } catch (error) {
      console.error('❌ TEXT parsing failed:', error.message);
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async extractTextFromFile(file: {
    originalname: string;
    buffer: Buffer;
  }): Promise<string> {
    console.log('=== File Parser Started ===');
    console.log('📁 File details:', {
      originalname: file.originalname,
      bufferLength: file.buffer.length,
    });

    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new Error('Invalid file buffer provided to parser');
    }

    if (file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    try {
      const lowerName = file.originalname.toLowerCase();

      if (lowerName.endsWith('.pdf')) {
        return await this.parsePDF(file.buffer);
      } else if (lowerName.endsWith('.docx')) {
        return await this.parseDOCX(file.buffer);
      } else if (lowerName.endsWith('.txt')) {
        return await this.parseText(file.buffer);
      } else {
        throw new Error(
          `Unsupported file format: ${file.originalname}. Please upload PDF, DOCX, or TXT files.`,
        );
      }
    } catch (error) {
      console.error('❌ File extraction failed:', error.message);
      throw error;
    }
  }
}
