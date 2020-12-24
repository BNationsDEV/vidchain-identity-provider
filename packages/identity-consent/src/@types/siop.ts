export interface SiopUriRedirect {
  clientUriRedirect?: string;
  challenge?: string;
  client_name?: string;
  scope?: string;
  isMobile?: boolean;
}

export interface QRResponse {
  imageQr: string;
  siopUri: string;
  terminalQr?: string;
}

export interface MessageSendQRResponse {
  clientId: string;
  qRResponse: QRResponse;
}

export interface SiopResponse {
  validationResult: boolean;
  did: string;
  jwt: string;
}

export interface MessageSendSignInResponse {
  clientId: string;
  siopResponse: SiopResponse;
}

export interface SiopResponseJwt {
  jwt: string;
  login_challenge?: string;
}

export interface SiopRequestJwt {
  jwt: string;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}
