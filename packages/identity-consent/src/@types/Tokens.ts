import { JWTClaims } from "@validatedid/did-auth";

export interface IEnterpriseAuthZToken extends JWTClaims {
  sub?: string;
  did: string;
  aud: string;
  nonce: string;
}

export enum TokenType {
  bearer = "Bearer",
}

export interface AccessTokenResponseBody {
  accessToken: string;
  tokenType: TokenType.bearer;
  expiresIn: number; // 15 minutes
  issuedAt: number;
}
