import {
  Process,
  Processor,
  InjectQueue,
  OnQueueCompleted,
} from "@nestjs/bull";
import {
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Job, Queue } from "bull";
import { parse } from "querystring";
import QRCode from "qrcode";
import io from "socket.io-client";
import Redis from "ioredis";
import {
  createUriRequest,
  DidAuthErrors,
  DidAuthTypes,
  OidcClaim,
} from "@validatedid/did-auth";
import {
  API_BASE_URL,
  BASE_URL,
  IDENTITY_PROVIDER_APP,
  REDIS_PORT,
  REDIS_URL,
  SIGNATURES,
} from "../config";
import { UserRequest } from "../@types/events";
import {
  doPostCall,
  getAuthToken,
  getEnterpriseDID,
  getVcFromScope,
} from "../util/Util";
import ERRORS from "../util/error";
import {
  MessageSendQRResponse,
  QRResponse,
  SiopAckRequest,
} from "../@types/siop";

const getResponseContext = (
  userRequest: UserRequest
): DidAuthTypes.DidAuthResponseContext => {
  if (userRequest.isMobile) {
    return DidAuthTypes.DidAuthResponseContext.WALLET;
  }
  return DidAuthTypes.DidAuthResponseContext.RP;
};

const generateJwtRequest = async (
  jwt: string,
  job: Job
): Promise<DidAuthTypes.UriRequest> => {
  const did: string = getEnterpriseDID(jwt);
  const userRequest = job.data as UserRequest;
  const claims: OidcClaim = {
    vc: getVcFromScope(userRequest.clientScope),
  };
  const responseContext = getResponseContext(userRequest);

  const requestOpts: DidAuthTypes.DidAuthRequestOpts = {
    oidpUri: IDENTITY_PROVIDER_APP,
    redirectUri: `${BASE_URL}/siop/responses`,
    requestObjectBy: {
      type: DidAuthTypes.ObjectPassedBy.REFERENCE,
      referenceUri: `${BASE_URL}/siop/jwts/${userRequest.sessionId}`,
    },
    signatureType: {
      signatureUri: SIGNATURES,
      did,
      authZToken: jwt,
      kid: `${did}#keys-1`,
    },
    registrationType: {
      type: DidAuthTypes.ObjectPassedBy.REFERENCE,
      referenceUri: `${API_BASE_URL}/${did};transform-keys=jwks`,
    },
    responseMode: DidAuthTypes.DidAuthResponseMode.FORM_POST,
    responseContext,
    claims,
  };
  return createUriRequest(requestOpts);
};

@Processor("siop")
export default class SiopProcessor {
  constructor(
    @InjectQueue("siopError") private readonly siopErrorQueue: Queue
  ) {}

  private readonly logger = new Logger(SiopProcessor.name);

  private readonly nonceRedis = new Redis({
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "nonce:",
  });

  private readonly stateRedis = new Redis({
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "state:",
  });

  private readonly jwtRedis = new Redis({
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "jwt:",
  });

  private readonly socket = io(BASE_URL, {
    transports: ["websocket"],
  });

  @Process("userRequest")
  async handleSiopRequest(job: Job): Promise<string> {
    this.logger.debug("SIOP Request received.");
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    if (!job || !job.data)
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS);

    const redisUserRequest = job.data as UserRequest;
    if (!redisUserRequest.clientId || !redisUserRequest.sessionId)
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS);
    const authZToken = await getAuthToken();
    // TODO: When type OidcClaim is export it by the library used it.
    const uriRequest = await generateJwtRequest(authZToken, job);
    if (!uriRequest || !uriRequest.urlEncoded)
      throw new InternalServerErrorException(ERRORS.NO_URL_ENCODED);
    const uriDecoded = decodeURI(uriRequest.urlEncoded);
    this.logger.debug(`SIOP Request URI: ${uriDecoded}`);
    await this.storeSessionIdWithJwtNonceAndState(
      uriDecoded,
      redisUserRequest,
      uriRequest
    );

    return uriDecoded;
  }

  private async storeSessionIdWithJwtNonceAndState(
    uriDecoded: string,
    redisUserRequest: UserRequest,
    uriRequest: DidAuthTypes.UriRequest
  ) {
    if (!uriRequest || !uriRequest.jwt)
      throw new InternalServerErrorException(ERRORS.NO_REQUEST_JWT_CREATED);
    // Creates a URI using the wallet backend that manages entity DID keys
    this.logger.debug(`SIOP Request JWT: ${uriRequest.jwt}`);
    // store siopRequestJwt with the user session id
    await this.jwtRedis.set(redisUserRequest.sessionId, uriRequest.jwt);
    const data = parse(uriDecoded);
    const nonce = data.nonce as string;
    this.logger.debug(`SIOP Request nonce: ${nonce}`);
    await this.nonceRedis.set(nonce, redisUserRequest.sessionId);
    const state = data.state as string;
    this.logger.debug(`SIOP Request state: ${state}`);
    await this.stateRedis.set(state, redisUserRequest.sessionId);
    this.logger.debug("SIOP Request completed.");
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: string): Promise<void> {
    this.logger.debug("SIOP Request event completed.");
    this.logger.debug(`Processing result`);
    this.logger.debug(`Result: ${JSON.stringify(result)}`);
    this.logger.debug(
      `Job data to process: ${JSON.stringify(job.data, null, 2)}`
    );
    if (!job || !job.data || !result) {
      this.logger.error(DidAuthErrors.BAD_PARAMS);
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS);
    }
    const userRequestData = job.data as UserRequest;

    // Append the client name to the result
    const qrCodeResult = `${result}&client_name=${userRequestData.clientName}`;

    // when clientUriRedirect NOT present, print QR to be read from an APP
    if (!userRequestData.clientUriRedirect) {
      // generate QR code image
      const dropPrefixForQRImage = qrCodeResult.split(
        `${IDENTITY_PROVIDER_APP}?`
      )[1];
      const imageQr = await QRCode.toDataURL(dropPrefixForQRImage);
      const qrResponse: QRResponse = {
        imageQr,
        siopUri: qrCodeResult,
      };

      const messageSendQRResponse: MessageSendQRResponse = {
        clientId: userRequestData.sessionId,
        qRResponse: qrResponse,
      };
      this.logger.debug(
        `message QR Response: ${JSON.stringify(messageSendQRResponse, null, 2)}`
      );

      // sends an event to the server, to send the QR to the client
      this.socket.emit("sendSIOPRequestJwtToFrontend", messageSendQRResponse);
      this.logger.log("End of function");
    }

    // when clientUriRedirect is present, we post the SIOP URI to the user server
    if (userRequestData.clientUriRedirect) {
      const response = (await doPostCall(
        qrCodeResult,
        userRequestData.clientUriRedirect
      )) as SiopAckRequest;
      this.logger.debug(`Response: ${JSON.stringify(response)}`);
      // sends error to Front-end
      if (!response || !response.validationRequest) {
        this.logger.debug("Error on SIOP Request Validation.");
        await this.siopErrorQueue.add("errorSiopRequestValidation");
      }
    }
  }
}
