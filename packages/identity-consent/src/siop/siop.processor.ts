import { Process, Processor, InjectQueue, OnQueueCompleted } from '@nestjs/bull';
import { Logger, BadRequestException, Body } from '@nestjs/common';
import { Job, Queue } from 'bull'
import { parse } from "querystring";
import * as siopDidAuth from "@validatedid/did-auth";
import { SiopAckRequest, QRResponse, MessageSendQRResponse, OidcClaim } from './dtos/SIOP';
import { doPostCall, getAuthToken, getVcFromScope, generateJwtRequest } from 'src/util/Util';
import { BASE_URL, SIGNATURES, IDENTITY_PROVIDER_APP, REDIS_PORT, REDIS_URL } from '../config';
import QRCode from 'qrcode';
import io from 'socket.io-client';
import Redis from 'ioredis';

@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}

  private readonly logger = new Logger(SiopProcessor.name);
  private readonly nonceRedis = new Redis({ 
    port: REDIS_PORT,
    host: REDIS_URL,
    keyPrefix: "nonce:" 
  });
  private readonly jwtRedis = new Redis({  
    port: REDIS_PORT,
    host: REDIS_URL, 
    keyPrefix: "jwt:" });
  private readonly socket = io(BASE_URL);

  @Process('userRequest')
  async handleSiopRequest(job: Job): Promise<string> {
    this.logger.debug('SIOP Request received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`)
    if (!job || !job.data || !job.data.clientId || !job.data.sessionId) {
      throw new BadRequestException(siopDidAuth.DidAuthErrors.BAD_PARAMS)
    }
    const authZToken = await getAuthToken();
    //TODO: When type OidcClaim is export it by the library used it.
    
    const uriRequest: siopDidAuth.DidAuthTypes.UriRequest = await generateJwtRequest(authZToken, job);
    // Creates a URI using the wallet backend that manages entity DID keys
    this.logger.debug(`SIOP Request JWT: ${uriRequest.jwt}`)
    // store siopRequestJwt with the user session id
    this.jwtRedis.set(job.data.sessionId, uriRequest.jwt);

    const uriDecoded = decodeURIComponent(uriRequest.urlEncoded);
    this.logger.debug(`SIOP Request URI: ${uriDecoded}`)
    // store sessionId and nonce 
    const data = parse(uriDecoded);
    const nonce = data.nonce as string;
    this.logger.debug(`SIOP Request nonce: ${nonce}`)
    this.nonceRedis.set(nonce, job.data.sessionId)
    this.logger.debug('SIOP Request completed.')

    return uriDecoded
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: string) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing result`)
    this.logger.debug('Result: ' + JSON.stringify(result))
    if (!job || !job.data || !result) {
      throw new BadRequestException(siopDidAuth.DidAuthErrors.BAD_PARAMS)
    }

    //Append the client name to the result
    const qrCodeResult = result + "&client_name="+job.data.clientName;

    // when clientUriRedirect NOT present, print QR to be read from an APP
    // !!! TODO: implement a way to send the siop:// and be catched by client (web plugin or APP deep link)
    if (!job.data.clientUriRedirect) {
      // generate QR code image
      const dropPrefixForQRImage = qrCodeResult.split(IDENTITY_PROVIDER_APP+"?")[1];
      const imageQr = await QRCode.toDataURL(dropPrefixForQRImage)
      const qrResponse:QRResponse = {
        imageQr, 
        siopUri: qrCodeResult
      }

      const messageSendQRResponse: MessageSendQRResponse = {
        clientId: job.data.sessionId,
        qRResponse: qrResponse
      }
      // sends an event to the server, to send the QR to the client
      this.socket.emit('sendSIOPRequestJwtToFrontend', messageSendQRResponse);
    }

    // when clientUriRedirect is present, we post the SIOP URI to the user server
    if (job.data.clientUriRedirect) {
      const response:SiopAckRequest = await doPostCall(qrCodeResult, job.data.clientUriRedirect)
      this.logger.debug('Response: ' + JSON.stringify(response))
      // sends error to Front-end
      if (!response || !response.validationRequest) {
        this.logger.debug('Error on SIOP Request Validation.')
        await this.siopErrorQueue.add('errorSiopRequestValidation');
      }
    }
  }


}