import axios from 'axios';
import { JWT } from 'jose';
import { BadRequestException } from '@nestjs/common';
import { Job } from 'bull'
import { decode as atob, encode } from "base-64";
import * as siopDidAuth from "@validatedid/did-auth";
import { SESSIONS, grantType, Entity, scope, BASE_URL, SIGNATURES, IDENTITY_PROVIDER_APP } from '../config';
import { ERRORS } from './error';
import { OidcClaimRequest, OidcClaimJson } from '../siop/dtos/SIOP';
import { IEnterpriseAuthZToken, JWTPayload } from '../siop/dtos/Tokens';
import { response } from 'express';

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


function decodePayload( jwt: string ): JWTPayload{
  const { payload } = JWT.decode(jwt, { complete: true });
  return payload as JWTPayload;
}

function getEnterpriseDID(token: string): string {
  const { payload } = JWT.decode(token, { complete: true });
  return (payload as IEnterpriseAuthZToken).did;
}

const generateJwtRequest = async (jwt: string, job: Job): Promise<siopDidAuth.DidAuthTypes.UriRequest> => {
  const did: string = getEnterpriseDID(jwt);

  const claims: siopDidAuth.OidcClaim = {
    vc: getVcFromScope(job.data.clientScope)
  };

  let responseContext: siopDidAuth.DidAuthTypes.DidAuthResponseContext = siopDidAuth.DidAuthTypes.DidAuthResponseContext.RP;
  if(!job.data.isMobile){
    responseContext = siopDidAuth.DidAuthTypes.DidAuthResponseContext.WALLET
  }


  const requestOpts: siopDidAuth.DidAuthTypes.DidAuthRequestOpts = {
    oidpUri: IDENTITY_PROVIDER_APP,
    redirectUri:  BASE_URL + "/siop/responses",
    requestObjectBy: {
      type: siopDidAuth.DidAuthTypes.ObjectPassedBy.REFERENCE,
      referenceUri: BASE_URL + "/siop/jwts/"+ job.data.sessionId
    },
    signatureType: {
      signatureUri: SIGNATURES,
      did: did,
      authZToken: jwt,
      kid: `${did}#key-1`,
    },
    registrationType: {
      type: siopDidAuth.DidAuthTypes.ObjectPassedBy.REFERENCE,
      referenceUri: `https://dev.vidchain.net/api/v1/identifiers/${did};transform-keys=jwks`,
    },
    responseMode: siopDidAuth.DidAuthTypes.DidAuthResponseMode.FORM_POST,
    responseContext: responseContext,
    claims: claims,
  };
  const uriRequest: siopDidAuth.DidAuthTypes.UriRequest = await siopDidAuth.createUriRequest(requestOpts);
  return uriRequest;
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
  const scopeArray: string[] = scope.split(",");
  let claim: OidcClaimRequest = {};
  scopeArray.forEach((value,index) => {
    //Skip the first two scopes. Ex: offline openid VerifiableIdCredential
    if(value !== "openid" && value !== "offline"){
      const oidcClaim: OidcClaimJson = {
        essential: true
      }
      claim[value] = oidcClaim;
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
  getVcFromScope,
  generateJwtRequest
};