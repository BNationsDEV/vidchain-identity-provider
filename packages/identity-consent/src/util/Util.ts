import axios from 'axios';
import { JWT } from 'jose';
import { BadRequestException } from '@nestjs/common';
import { DidAuthResponsePayload } from 'src/did-auth/src';
import { SESSIONS, grantType, assertion, scope } from '../config';
import { ERRORS } from './error';

async function doPostCall(data: any, url: string): Promise<any> {
  try {
    console.log ('Calling url: ' + url)
    const response = await axios.post(url, data);
    console.log('AXIOS RESPONSE: ');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log((error as Error).message, url);
    console.log((error as Error).name);
    console.log((error as Error).stack);
    throw error;
  }
}

async function getAuthToken(): Promise<any> {
  try {
    const url = SESSIONS;
    const data = {
      grantType: grantType,
      assertion: assertion,
      scope: scope
    }
    const response = await axios.post(url, data);
    return response.data.accessToken;
  } catch (error) {
    throw new BadRequestException(ERRORS.SESSION)
  }
}


function decodePayload( jwt: string ): DidAuthResponsePayload{
  const { payload } = JWT.decode(jwt, { complete: true });
  return payload as DidAuthResponsePayload;
}

function getJwtNonce(jwt: string): string {
  return decodePayload(jwt).nonce
}

function getUserDid( jwt: string ): string {
  const didWithSufix = decodePayload(jwt).sub_jwk.kid;
  return parseUserDid(didWithSufix);
}

function parseUserDid( did: string ): string {
  return did.split("#")[0];
}

function isTokenExpired(jwt) {
  if (jwt === null || jwt === "") return true;
  const payload = decodePayload(jwt);
  if (!payload || !payload.exp) return true;
  return +payload.exp * 1000 < Date.now();
}

export {
  doPostCall,
  getUserDid,
  getJwtNonce,
  isTokenExpired,
  getAuthToken
};