import { Controller, Post, Body, BadRequestException, Logger, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopResponseJwt, SiopResponse,MessageSendSignInResponse, SiopRequestJwt, DidAuthValidationResponse } from './dtos/SIOP';
import { VidDidAuth, DidAuthErrors} from '@validatedid/did-auth';
import { CLIENT_ID_URI, REDIS_URL, REDIS_PORT , BASE_URL, SIGNATURE_VALIDATION } from '../config';
import { getUserDid, getJwtNonce, getAuthToken, doPostCall} from '../util/Util';
import io from 'socket.io-client';
import Redis from 'ioredis';

@Controller('siop')
export class SiopController {
  constructor(@InjectQueue('siop') private readonly siopQueue: Queue) {}
  private readonly logger = new Logger(SiopController.name);
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

  @Post('responses')
  async validateSIOPResponse(@Body() siopResponseJwt: SiopResponseJwt): Promise<DidAuthValidationResponse> {
    this.logger.log('[RP Backend] Received POST SIOP Response from SIOP client')
    if (!siopResponseJwt || !siopResponseJwt.jwt) {
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS)
    }
    this.logger.log(`[RP Backend] Received SIOP Response JWT: ${JSON.stringify(siopResponseJwt)}`)
    const authZToken = await getAuthToken();
    // validate siop response
    const nonce = await this._getValidNonce(siopResponseJwt.jwt);
    const clientID = await this._getValidClient(nonce);
    this.logger.log("Nonce: "+nonce);
    this.logger.log("Client: "+ clientID);
    const verifyDidAuthResponse:DidAuthValidationResponse = await VidDidAuth.verifyDidAuthResponse(
      siopResponseJwt.jwt, 
      SIGNATURE_VALIDATION, 
      authZToken,
      nonce
    );
    // const verifyDidAuthResponse:DidAuthValidationResponse = {
    //   signatureValidation: true
    // }
    this.logger.debug(`[RP Backend] SIOP Response validation: ${verifyDidAuthResponse.signatureValidation}`)
    if (!verifyDidAuthResponse.signatureValidation) {
      this.logger.error(DidAuthErrors.ERROR_VERIFYING_SIGNATURE)
      throw new BadRequestException(DidAuthErrors.ERROR_VERIFYING_SIGNATURE)
    }
    // prepare siop response struct to return
    const validationResult:boolean = verifyDidAuthResponse.signatureValidation;

    const siopResponse:SiopResponse = { 
      validationResult,
      did: getUserDid(siopResponseJwt.jwt),
      jwt: siopResponseJwt.jwt
    }

    const messageSendSignInResponse: MessageSendSignInResponse = {
      clientId: clientID,
      siopResponse: siopResponse
    }


    //CHECK WHAT TO DO HERE, IF IS FROM WEB FO TO EMIT, OTHERWISE RETURN VALUE
    if(siopResponseJwt.login_challenge){
      this.logger.debug(`I have challenge`);
      this.logger.debug(siopResponseJwt.login_challenge);
      const did = siopResponse.did 

      //const did = "did:ebsi:0x2c8181B9bF7F8f708A7C68DaE04d6d56A87dFBD3"
      const body = {
        challenge: siopResponseJwt.login_challenge,
        remember: false,
        did
      };
      const res = await doPostCall(body, BASE_URL+'/login',);
      return res;
    }
    else{
      this.logger.debug(`I DO not have challenge`);
      this.socket.emit('sendSignInResponse', messageSendSignInResponse );
    }
    
    // send a message to server so it can communicate with front end io client
    // and send the validation response
    //this.socket.emit('sendSignInResponse', messageSendSignInResponse );
    // also send the response to the siop client
    return verifyDidAuthResponse
  }

  @Get('jwts/:clientId')
  async getSIOPRequestJwt(@Param('clientId') clientId: string): Promise<SiopRequestJwt> {
    // retrieve jwt value stored in the DB with a key cliendId
    const jwt = await this.jwtRedis.get(clientId)
    this.logger.debug(`Received request from ${clientId} to get the JWT`);
    return { jwt }
  }

  private async _getValidNonce(jwt: string): Promise<string> {
    const nonce = getJwtNonce(jwt);
    // loads nonce from Redis as a stored key or throws error if not found
    try {
      await this.nonceRedis.get(getJwtNonce(jwt));  
    } catch (error) {
      this.logger.error(DidAuthErrors.BAD_PARAMS)
      throw new BadRequestException(DidAuthErrors.BAD_PARAMS)
    }
    return nonce;
  }

  private async _getValidClient(nonce: string): Promise<any> {
      const clients = await this.nonceRedis.get(nonce);
      this.logger.debug(`---- ${clients} ----`);
      return clients;
  }
}
