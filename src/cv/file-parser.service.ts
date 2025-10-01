import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';

// Fallback PDF parser if pdf-parse fails
const parsePDFFallback = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Simple text extraction as fallback
    const text = buffer.toString('utf-8');
    // Extract readable text (removes binary data)
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (cleanText.length > 100) {
      resolve(cleanText);
    } else {
      reject(new Error('PDF appears to be scanned or image-based'));
    }
  });
};

@Injectable()
export class FileParserService {
  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      console.log('Attempting to parse PDF with pdf-parse...');

      // Dynamic import to avoid issues
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);

      if (data.text && data.text.length > 50) {
        return data.text;
      } else {
        throw new Error('PDF text extraction returned empty or too short text');
      }
    } catch (error) {
      console.log('PDF parse failed, trying fallback method:', error.message);
      return await parsePDFFallback(buffer);
    }
  }

  async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      console.log('Parsing DOCX file...');
      const result = await mammoth.extractRawText({ buffer });

      if (result.value && result.value.length > 50) {
        return result.value;
      } else {
        throw new Error(
          'DOCX text extraction returned empty or too short text',
        );
      }
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  async parseText(buffer: Buffer): Promise<string> {
    console.log('Parsing TEXT file...');
    const text = buffer.toString('utf-8');

    if (text.length < 50) {
      throw new Error('Text file is too short or empty');
    }

    return text;
  }

  async extractTextFromFile(file: any): Promise<string> {
    const { originalname, buffer } = file;

    console.log('Processing file:', originalname, 'Size:', buffer.length);

    try {
      if (originalname.toLowerCase().endsWith('.pdf')) {
        return await this.parsePDF(buffer);
      } else if (originalname.toLowerCase().endsWith('.docx')) {
        return await this.parseDOCX(buffer);
      } else if (originalname.toLowerCase().endsWith('.txt')) {
        return await this.parseText(buffer);
      } else {
        throw new Error(
          'Unsupported file format. Please upload PDF, DOCX, or TXT files.',
        );
      }
    } catch (error) {
      console.error('File parsing error:', error);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }
}
