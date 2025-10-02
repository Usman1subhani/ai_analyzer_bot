import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroqService } from './ai/groq.service';
import { CvModule } from './cv/cv.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CvModule,
  ],
  controllers: [AppController],
  providers: [AppService, GroqService],
})
export class AppModule {}
