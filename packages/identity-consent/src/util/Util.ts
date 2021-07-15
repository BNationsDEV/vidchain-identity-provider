import { BadRequestException } from "@nestjs/common";
import { DidAuthTypes, OidcClaimRequest, OidcSsi } from "@validatedid/did-auth";
import jwt_decode from "jwt-decode";
import { JWTPayload } from "@validatedid/did-auth/dist/interfaces/JWT";
import ERRORS from "./error";
import { IEnterpriseAuthZToken } from "../@types/Tokens";

// TODO: When type OidcClaim is export it by the library used it.
function getVcFromScope(inputScope: string): OidcClaimRequest {
  const scopeArray: string[] = inputScope.split(",");
  const claim: OidcClaimRequest = {};
  scopeArray.forEach((value) => {
    // Skip the standard  scopes. Ex: offline openid email VerifiableIdCredential
    if (value !== "openid" && value !== "offline" && value !== "email") {
      const oidcClaim: OidcSsi.OidcClaimJson = {
        essential: true,
      };
      claim[value] = oidcClaim;
    }
  });
  return claim;
}

function getEnterpriseDID(token: string): string {
  const payload = jwt_decode(token);
  return (payload as IEnterpriseAuthZToken).did;
}

function getJwtNonce(jwt: string): string {
  const payload = jwt_decode(jwt);
  return (payload as IEnterpriseAuthZToken).nonce;
}

function parseUserDid(did: string): string {
  return did.split("#")[0];
}

function getUserDid(jwt: string): string {
  const payload = jwt_decode(jwt);
  const { did } = payload as DidAuthTypes.DidAuthResponsePayload;
  if (!did) {
    const didWithSufix = (payload as DidAuthTypes.DidAuthResponsePayload)
      .sub_jwk.kid;
    if (!didWithSufix) throw new BadRequestException(ERRORS.NO_KID_FOUND);
    return parseUserDid(didWithSufix);
  }
  return did;
}

function isTokenExpired(jwt: string): boolean {
  if (jwt === null || jwt === "") return true;
  const payload = jwt_decode(jwt);
  if (!payload) return true;
  const { exp } = payload as JWTPayload;
  if (!exp) return true;
  return +exp * 1000 < Date.now();
}

export {
  getUserDid,
  getJwtNonce,
  isTokenExpired,
  getVcFromScope,
  getEnterpriseDID,
};
