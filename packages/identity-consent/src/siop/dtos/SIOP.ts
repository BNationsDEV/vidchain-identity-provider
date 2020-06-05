export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopUriRedirect {
  clientUriRedirect?: string;
  challenge?: string;
}

export interface SiopRequestJwt {
  jwt: string;
}

export interface SiopResponseJwt {
  jwt: string;
}

export interface SiopResponseProcessed extends SiopResponseJwt {
  validationResult: boolean;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface SiopResponse {
  validationResult: boolean;
  did: string;
  jwt: string;
}

export interface SiopAckResponse {
  validationResult: boolean;
}

export interface QRResponse {
  imageQr: string;
  siopUri: string;
  terminalQr?: string;
}

export interface verifyDidAuthResponse {
  signatureValidation: boolean;
}
export interface DidAuthValidationResponse {
  signatureValidation: boolean;
}

export interface LoginResponse {
  signatureValidation: boolean;
  challenge: string;
  did: string;
}
