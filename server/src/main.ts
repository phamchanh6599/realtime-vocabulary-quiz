import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: ['http://localhost:5173/', '*'],
      methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'PATCH'],
    },
  });
  await app.listen(3000);
}
bootstrap();
