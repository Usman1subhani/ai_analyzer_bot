import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend applications
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000); 
  console.log('CV Analyzer Bot running on http://localhost:3000');
}
bootstrap();
