import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  Get,
  Param,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import {
  DidAuthTypes,
  DidAuthErrors,
  verifyDidAuthResponse,
} from "@validatedid/did-auth";
import io from "socket.io-client";
import Redis from "ioredis";
import {
  REDIS_URL,
  REDIS_PORT,
  BASE_URL,
  SIGNATURE_VALIDATION,
  API_BASE_URL,
} from "../config";
import { getUserDid, getJwtNonce } from "../util/Util";
import { getAuthToken, doPostCall } from "../services/apis";
import ERRORS from "../util/error";
import {
  MessageSendSignInResponse,
  SiopRequestJwt,
  SiopResponse,
  SiopResponseJwt,
} from "../@types/siop";

@Controller("siop")
export default class SiopController {
  constructor(@InjectQueue("siop") private readonly siopQueue: Queue) {}

  private readonly logger = new Logger(SiopController.name);

  private readonly nonceRedis = new Redis({
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "nonce:",
  });

  private readonly jwtRedis = new Redis({
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "jwt:",
  });

  private readonly socket = io(BASE_URL, {
    transports: ["websocket"],
  });

  @Post("responses")
  async validateSIOPResponse(
    @Body() siopEncodedResponse: string
  ): Promise<DidAuthTypes.DidAuthValidationResponse> {
    this.logger.log(
      "[RP Backend] Received POST SIOP Response from SIOP client"
    );
    const bodyDecoded = decodeURI(siopEncodedResponse);
    const siopResponseJwt = JSON.parse(bodyDecoded) as SiopResponseJwt;
    if (
      !siopResponseJwt ||
      !siopResponseJwt.id_token ||
      !siopResponseJwt.state
    ) {
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS);
    }
    const authZToken = await getAuthToken();
    // TODO: !!! verify state
    // It means that the app should call this POST with the id_token & state as the body
    // then verify nonce and remove it from redis (it can be called once)
    // extract nonce and cliendId from redis (using state as key -> it has to change as now it is using another nonce as key)
    // validate siop response
    const nonce = await this.getValidNonce(siopResponseJwt.id_token);
    const clientID = await this.getValidClient(nonce);

    const optsVerify: DidAuthTypes.DidAuthVerifyOpts = {
      verificationType: {
        verifyUri: SIGNATURE_VALIDATION,
        authZToken,
        didUrlResolver: `${API_BASE_URL}/api/v1/identifiers`,
      },
      redirectUri: `${BASE_URL}/siop/responses`,
      nonce,
    };
    const validationResponse = await verifyDidAuthResponse(
      siopResponseJwt.id_token,
      optsVerify
    );

    if (!validationResponse.signatureValidation) {
      this.logger.error(DidAuthErrors.ERROR_VERIFYING_SIGNATURE);
      throw new BadRequestException(DidAuthErrors.ERROR_VERIFYING_SIGNATURE);
    }

    const siopResponse: SiopResponse = {
      validationResult: validationResponse.signatureValidation,
      did: getUserDid(siopResponseJwt.id_token),
      jwt: siopResponseJwt.id_token,
    };

    const messageSendSignInResponse: MessageSendSignInResponse = {
      clientId: clientID,
      siopResponse,
    };

    if (siopResponseJwt.login_challenge) {
      const { did } = siopResponse;
      const body = {
        challenge: siopResponseJwt.login_challenge,
        remember: false,
        did,
        jwt: siopResponseJwt.id_token,
      };
      return (await doPostCall(
        body,
        `${BASE_URL}/login`
      )) as DidAuthTypes.DidAuthValidationResponse;
    }

    // send a message to server so it can communicate with front end io client
    // and send the validation response
    this.socket.emit("sendSignInResponse", messageSendSignInResponse);
    // also send the response to the siop client
    this.logger.debug(
      `Returning Response to the app: ${JSON.stringify(
        validationResponse,
        null,
        2
      )}`
    );
    return validationResponse;
  }

  @Get("jwts/:clientId")
  async getSIOPRequestJwt(
    @Param("clientId") clientId: string
  ): Promise<SiopRequestJwt> {
    // retrieve jwt value stored in the DB with a key cliendId
    const jwt = await this.jwtRedis.get(clientId);
    if (!jwt) throw new InternalServerErrorException(ERRORS.NO_REDIS_JWT_FOUND);
    this.logger.debug(`Received request from ${clientId} to get the JWT`);
    return { jwt };
  }

  private async getValidNonce(jwt: string): Promise<string> {
    const nonce = getJwtNonce(jwt);
    // loads nonce from Redis as a stored key or throws error if not found
    try {
      await this.nonceRedis.get(getJwtNonce(jwt));
    } catch (error) {
      this.logger.error(DidAuthErrors.BAD_PARAMS);
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS);
    }
    return nonce;
  }

  private async getValidClient(nonce: string): Promise<string> {
    const clients = await this.nonceRedis.get(nonce);
    if (!clients)
      throw new InternalServerErrorException(ERRORS.NO_REDIS_CLIENTS_FOUND);
    this.logger.debug(`---- ${clients} ----`);
    return clients;
  }
}
