import { Process, Processor, InjectQueue, OnQueueCompleted } from '@nestjs/bull';
import { Logger, BadRequestException, Body } from '@nestjs/common';
import { Job, Queue } from 'bull'
import { EbsiDidAuth, DidAuthRequestCall, DIDAUTH_ERRORS} from '../did-auth/src/index';
import { SiopUriRequest, SiopResponse, SiopAckRequest, QRResponse, SiopResponseJwt, DidAuthValidationResponse, LoginResponse } from './dtos/SIOP';
import { doPostCall, getUserDid, getJwtNonce } from 'src/util/Util';
import { BASE_URL, SIGNATURES, authZToken, SIGNATURE_VALIDATION } from 'src/Config';
import QRCode from 'qrcode';
import io from 'socket.io-client';
import Redis from 'ioredis';


@Processor('siop')
export class SiopProcessor {
  constructor(@InjectQueue('siopError') private readonly siopErrorQueue: Queue) {}
  private readonly logger = new Logger(SiopProcessor.name);
  private readonly jwtRedis = new Redis({ keyPrefix: "jwt:" });
  private readonly nonceRedis = new Redis({ keyPrefix: "nonce:" });
  private readonly socket = io(BASE_URL);

  @Process('userRequest')
  async handleSiopRequest(job: Job): Promise<string> {
    this.logger.debug('SIOP Request received.')
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`)
    if (!job || !job.data || !job.data.clientId || !job.data.sessionId) {
      console.log(DIDAUTH_ERRORS.BAD_PARAMS);
      throw new BadRequestException(DIDAUTH_ERRORS.BAD_PARAMS)
    }
    console.log(job.data.sessionId);
    const didAuthRequestCall: DidAuthRequestCall = {
      redirectUri: "https://519c97e93f4c.ngrok.io/siop/responses",
      signatureUri: SIGNATURES,
      authZToken: authZToken
    };
    console.log(didAuthRequestCall);
    // Creates a URI using the wallet backend that manages entity DID keys
    const { uri, nonce, jwt } = await EbsiDidAuth.createUriRequest(didAuthRequestCall);
    //----For testing
    // const uri = "openid://&scope=openid did_authn?response_type=id_token&client_id=http://localhost:300/login&request=eyJhbGciOiJFUzI1NkstUiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDplYnNpOjB4MmM4MTgxQjliRjdGOGY3MDhBN0M2OERhRTA0ZDZkNTZBODdkRkJEMyNrZXktMSJ9.eyJpYXQiOjE1OTEwMTU4NzAsImV4cCI6MTU5MTAxNjE3MCwiaXNzIjoiZGlkOmVic2k6MHgyYzgxODFCOWJGN0Y4ZjcwOEE3QzY4RGFFMDRkNmQ1NkE4N2RGQkQzIiwic2NvcGUiOiJvcGVuaWQgZGlkX2F1dGhuIiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwiY2xpZW50X2lkIjoiaHR0cDovL2xvY2FsaG9zdDozMDAvbG9naW4iLCJub25jZSI6IjMwY2YwNmUwLTFjNjYtNGZlMy05Yzk4LWQ4YWQxYTcwZTlkYiJ9.HA45d9dQQfXTJkrLA3glGwect5aTptT0uzaAg_RIl9i7o0NHuCIxDx7PN4UkXVGwCNpOpqkQfzsXC29T6wYqBAE";
    // const nonce = "0b605cdb-fbbc-48ef-b23a-97a16a280f85";
    // const jwt = "eyJhbGciOiJFUzI1NkstUiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDplYnNpOjB4MmM4MTgxQjliRjdGOGY3MDhBN0M2OERhRTA0ZDZkNTZBODdkRkJEMyNrZXktMSJ9.eyJpYXQiOjE1OTEwMTU4NzAsImV4cCI6MTU5MTAxNjE3MCwiaXNzIjoiZGlkOmVic2k6MHgyYzgxODFCOWJGN0Y4ZjcwOEE3QzY4RGFFMDRkNmQ1NkE4N2RGQkQzIiwic2NvcGUiOiJvcGVuaWQgZGlkX2F1dGhuIiwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwiY2xpZW50X2lkIjoiaHR0cDovL2xvY2FsaG9zdDozMDAvbG9naW4iLCJub25jZSI6IjMwY2YwNmUwLTFjNjYtNGZlMy05Yzk4LWQ4YWQxYTcwZTlkYiJ9.HA45d9dQQfXTJkrLA3glGwect5aTptT0uzaAg_RIl9i7o0NHuCIxDx7PN4UkXVGwCNpOpqkQfzsXC29T6wYqBAE";
    //----End testing
    this.logger.debug(`SIOP Request JWT: ${jwt}`)
    // store siopRequestJwt with the user session id
    this.jwtRedis.set(job.data.sessionId, jwt)
    this.logger.debug(`SIOP Request URI: ${uri}`)
    // store sessionId and nonce 
    this.nonceRedis.set(job.data.sessionId, nonce)
    this.logger.debug('SIOP Request completed.')

    return uri
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: string) {
    this.logger.debug('SIOP Request event completed.')
    this.logger.debug(`Processing result`)
    this.logger.debug('Result: ' + JSON.stringify(result))
    if (!job || !job.data || !result) {
      throw new BadRequestException(DIDAUTH_ERRORS.BAD_PARAMS)
    }

    // when clientUriRedirect NOT present, print QR to be read from an APP
    // !!! TODO: implement a way to send the siop:// and be catched by client (web plugin or APP deep link)
    if (!job.data.clientUriRedirect) {
      // generate QR code image 
      const imageQr = await QRCode.toDataURL(result)
      const qrResponse:QRResponse = {
        imageQr, 
        siopUri: result
      }
      // sends an event to the server, to send the QR to the client
      this.socket.emit('sendSIOPRequestJwtToFrontend', qrResponse);
    }

    // when clientUriRedirect is present, we post the SIOP URI to the user server
    if (job.data.clientUriRedirect) {
      const response:SiopAckRequest = await doPostCall(result, job.data.clientUriRedirect)
      this.logger.debug('Response: ' + JSON.stringify(response))
      // sends error to Front-end
      if (!response || !response.validationRequest) {
        this.logger.debug('Error on SIOP Request Validation.')
        await this.siopErrorQueue.add('errorSiopRequestValidation');
      }
    }
  }


}