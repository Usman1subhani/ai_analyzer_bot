import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileAnalyzerService } from '../ai/profile-analyzer.service';
import { ProfileScraperService } from '../scrapper/profile-scraper.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileAnalyzerService, ProfileScraperService],
})
export class ProfileModule {}
