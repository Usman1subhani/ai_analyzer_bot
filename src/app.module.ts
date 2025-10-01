import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CvModule } from './cv/cv.module';
import configuration from './config/configuration';
import { GroqService } from './ai/groq.service';
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
