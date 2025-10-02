// ------------Configs
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
// ------------Controlers
import { AppController } from './app.controller';
// ------------Modules
import { Module } from '@nestjs/common';
import { CvModule } from './cv/cv.module';
import { ProfileModule } from './profile/profile.module';
// ------------Services
import { AppService } from './app.service';
import { GroqService } from './ai/groq.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CvModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, GroqService],
})
export class AppModule {}
