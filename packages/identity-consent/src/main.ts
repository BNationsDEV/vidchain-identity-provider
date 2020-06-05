import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import{ PORT } from "./config" 
import { join } from 'path';
var csrf = require('csurf');
var cookieParser = require('cookie-parser')

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  //app.useStaticAssets(join(__dirname));
  app.useStaticAssets(__dirname);
  app.setBaseViewsDir(__dirname);
  app.setViewEngine('hbs');
  app.enableCors();
  app.use(cookieParser())

  await app.listen(PORT);
  app.use(csrf());
}
bootstrap();
