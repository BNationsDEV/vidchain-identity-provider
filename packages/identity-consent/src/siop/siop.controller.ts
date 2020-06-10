import { Controller, Post, Body, BadRequestException, Logger, Get, Param } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SiopResponseJwt, SiopAckResponse, SiopResponse, SiopRequestJwt, DidAuthValidationResponse,  } from './dtos/SIOP';
import { EbsiDidAuth, DidAuthRequestCall, DIDAUTH_ERRORS} from '../did-auth/src/index';
import { CLIENT_ID_URI, REDIS_URL, REDIS_PORT , BASE_URL, SIGNATURE_VALIDATION } from '../config';
import { getUserDid, getJwtNonce, getAuthToken} from '../util/Util';
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
      throw new BadRequestException(DIDAUTH_ERRORS.BAD_PARAMS)
    }
    this.logger.log(`[RP Backend] Received SIOP Response JWT: ${siopResponseJwt.jwt}`)
    const authZToken = await getAuthToken();
    // validate siop response
    const verifyDidAuthResponse:DidAuthValidationResponse = await EbsiDidAuth.verifyDidAuthResponse(
      siopResponseJwt.jwt, 
      SIGNATURE_VALIDATION, 
      authZToken,
      await this._getValidNonce(siopResponseJwt.jwt)
    );
    // const verifyDidAuthResponse:DidAuthValidationResponse = {
    //   signatureValidation: true
    // }
    this.logger.debug(`[RP Backend] SIOP Response validation: ${verifyDidAuthResponse.signatureValidation}`)
    if (!verifyDidAuthResponse.signatureValidation) {
      this.logger.error(DIDAUTH_ERRORS.ERROR_VERIFYING_SIGNATURE)
      throw new BadRequestException(DIDAUTH_ERRORS.ERROR_VERIFYING_SIGNATURE)
    }
    // prepare siop response struct to return
    const validationResult:boolean = verifyDidAuthResponse.signatureValidation;

    const siopResponse:SiopResponse = { 
      validationResult,
      did: getUserDid(siopResponseJwt.jwt),
      jwt: siopResponseJwt.jwt
    }
    
    // send a message to server so it can communicate with front end io client
    // and send the validation response
    this.socket.emit('sendSignInResponse', siopResponse);
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
      this.logger.error(DIDAUTH_ERRORS.BAD_PARAMS)
      throw new BadRequestException(DIDAUTH_ERRORS.BAD_PARAMS)
    }
    return nonce;
  }
}
