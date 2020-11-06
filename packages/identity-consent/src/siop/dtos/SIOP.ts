export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopUriRedirect {
  clientUriRedirect?: string;
  challenge?: string;
  client_name?: string;
}

export interface SiopRequestJwt {
  jwt: string;
}

export interface SiopResponseJwt {
  jwt: string;
  login_challenge?: string;
}

export interface SiopResponseProcessed extends SiopResponseJwt {
  validationResult: boolean;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface MessageSendSignInResponse {
  clientId: string;
  siopResponse: SiopResponse;
}

export interface SiopResponse {
  validationResult: boolean;
  did: string;
  jwt: string;
}

export interface SiopAckResponse {
  validationResult: boolean;
}

export interface MessageSendQRResponse {
  clientId: string;
  qRResponse: QRResponse;
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
