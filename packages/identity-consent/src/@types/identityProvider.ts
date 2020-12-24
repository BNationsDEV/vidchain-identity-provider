export interface LoginResponse {
  csrfToken: string;
  challenge: string;
  client_name: string;
  scope: string;
}

export interface LoginQuery {
  login_challenge: string;
}

export interface LoginRequestResponse {
  skip: boolean;
  subject: string;
  client: {
    client_name: string;
    client_id: string;
  };
  requested_scope: string;
}

export interface LoginAcceptResponse {
  redirect_to: string;
}

export type LoginRejectResponse = LoginAcceptResponse;

export interface LoginCookie {
  _csrf: string;
}

export interface DoLogin {
  challenge: string;
  submit: string;
  did: string;
  remember: boolean;
  jwt?: string;
}

export interface ConsentRequestResponse {
  requested_scope: string;
  requested_access_token_audience: string;
  context: {
    jwt: string;
  };
  skip: boolean;
}

export type ConsentAcceptResponse = LoginAcceptResponse;

export interface DoConsent {
  challenge: string;
  grant_scope: string | string[];
  remember: boolean;
}
