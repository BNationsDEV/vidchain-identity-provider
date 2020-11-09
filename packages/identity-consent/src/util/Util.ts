import axios from 'axios';
import { JWT } from 'jose';
import { BadRequestException } from '@nestjs/common';
import { decode as atob, encode } from "base-64";
import { DidAuthResponsePayload } from '@validatedid/did-auth';
import { SESSIONS, grantType, Entity, scope } from '../config';
import { ERRORS } from './error';
import { OidcClaimRequest } from '../siop/dtos/SIOP';

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
      assertion: strB64enc(Entity),
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
//TODO: When type OidcClaim is export it by the library used it.
function getVcFromScope(scope: string): OidcClaimRequest {
  const scopeArray: string[] = scope.split(" ");
  let claim: OidcClaimRequest = {};
  scopeArray.forEach((value,index) => {
    //Skip the first two scopes. Ex: offline openid VerifiableIdCredential
    if(index > 1){
      claim[value] = {
        essential: true
      }
    }
  })
  return claim;
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

/**
 * Encoded  a Base64 string in an UTF-8 string format
 * @param input Base64 encoded string to decode
 */
function strB64enc(input) {
  try {
    return encode(JSON.stringify(input));
  } catch (error) {
    return null;
  }
}

export {
  doPostCall,
  getUserDid,
  getJwtNonce,
  isTokenExpired,
  getAuthToken,
  getVcFromScope
};