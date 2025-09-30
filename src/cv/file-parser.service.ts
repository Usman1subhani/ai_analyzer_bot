import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class FileParserService {
  async parsePDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  async parseText(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const { originalname, buffer } = file;
    
    if (originalname.endsWith('.pdf')) {
      return await this.parsePDF(buffer);
    } else if (originalname.endsWith('.docx')) {
      return await this.parseDOCX(buffer);
    } else if (originalname.endsWith('.txt')) {
      return await this.parseText(buffer);
    } else {
      throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT files.');
    }
  }
}