import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CvModule } from './cv/cv.module';
import configuration from './config/configuration';
import { GeminiService } from './ai/gimini.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CvModule,
  ],
  controllers: [AppController],
  providers: [AppService, GeminiService],
})
export class AppModule {}
