import { format, transports } from "winston";
import { utilities as winstonUtilities, WinstonModule } from "nest-winston";
import { LoggerService } from "@nestjs/common";

export const consoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp(),
    winstonUtilities.format.nestLike("VIDchain Identity Provider")
  ),
  handleExceptions: true,
});

export const loggerOptions = {
  transports: [consoleTransport],
};

export const createLogger = (): LoggerService => {
  return WinstonModule.createLogger(loggerOptions);
};
