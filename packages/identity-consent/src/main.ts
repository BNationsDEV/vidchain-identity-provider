import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import express from "express";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import { PORT } from "./config";
import AppModule from "./app.module";
import { createLogger, consoleTransport } from "./logger/logger";

const logger = createLogger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  app.use("/static", express.static(join(__dirname, "..", "public")));
  app.setViewEngine("hbs");
  app.enableCors();
  app.use(cookieParser());

  await app.listen(PORT);
  app.use(csrf({ cookie: { secure: true } }));
  consoleTransport.level = "debug";
  logger.log(
    `Starting Identity Provider with:
      - LOG_LEVEL: debug
   `,
    "main"
  );
}
bootstrap()
  .then(() => {})
  .catch((e) => {
    throw e;
  });
