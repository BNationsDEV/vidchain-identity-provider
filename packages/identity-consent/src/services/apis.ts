import axios from "axios";
import { BadRequestException, Logger } from "@nestjs/common";
import { SESSIONS, grantType, Entity, scope } from "../config";
import { AccessTokenResponseBody } from "../@types/Tokens";
import ERRORS from "../util/error";

async function doPostCall(data: unknown, url: string): Promise<unknown> {
  const logger = new Logger("Util: doPostCall");
  try {
    logger.log(`Calling url: ${url}`);
    const response = await axios.post(url, data);
    logger.log("AXIOS RESPONSE: ");
    logger.log(response.data);
    return response.data as unknown;
  } catch (error) {
    logger.log((error as Error).message, url);
    logger.log((error as Error).name);
    logger.log((error as Error).stack);
    throw error;
  }
}

async function getAuthToken(): Promise<string> {
  const url = SESSIONS;
  const logger = new Logger("Util: AuthToken");
  logger.debug(JSON.stringify(Entity, null, 2));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(Entity, null, 2));
  const data = {
    grantType,
    assertion: Buffer.from(JSON.stringify(Entity)).toString("base64"),
    scope,
  };
  try {
    const response = await axios.post(url, data);
    if (
      !response ||
      !response.data ||
      !(response.data as AccessTokenResponseBody).accessToken
    )
      throw new BadRequestException(ERRORS.SESSION);

    return (response.data as AccessTokenResponseBody).accessToken;
  } catch (error) {
    logger.error(
      `POST AUTH TOKEN ERROR: ${(error as Error).message} : ${
        (error as Error).name
      }`
    );
    // eslint-disable-next-line no-console
    console.error(
      `POST AUTH TOKEN ERROR: ${(error as Error).message} : ${
        (error as Error).name
      }`
    );
    throw error;
  }
}

export { doPostCall, getAuthToken };
