// CONFIG PROJECT FILE
import * as dotenv from "dotenv";
import crypto from "crypto";
// importing .env variables
dotenv.config();

const REMEMBER_FOR_TIME = 3600; // When the session expires, in seconds. Set this to 0 so it will never expire.
const checkStrVar = (variable: string | undefined, name: string): string => {
  if (!variable) throw new Error(`undefined variable: ${name}`);
  return variable;
};

const PORT = process.env.PORT ? +process.env.PORT : 3000;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const SIOP_PATH = "/siop";
const RETURN_CALL = "/responses";

// client_id return callBack
const CLIENT_ID_URI = BASE_URL + SIOP_PATH + RETURN_CALL;

const REDIS_URL = checkStrVar(process.env.REDIS_URL, "REDIS_URL");
const REDIS_PORT = process.env.REDIS_PORT ? +process.env.REDIS_PORT : 6379;

const HYDRA_URL = process.env.HYDRA_URL || "http://127.0.0.1:9001";
const MOCK_TLS_TERMINATION = checkStrVar(
  process.env.MOCK_TLS_TERMINATION,
  "MOCK_TLS_TERMINATION"
);

const API_BASE_URL = checkStrVar(process.env.API_URL, "API_URL");
const SIGNATURES = `${API_BASE_URL}/api/v1/signatures`;
const SIGNATURE_VALIDATION = `${API_BASE_URL}/api/v1/signature-validations`;
const SESSIONS = `${API_BASE_URL}/api/v1/sessions`;
const API_KEY = checkStrVar(process.env.API_KEY, "API_KEY");
const IDENTITY_PROVIDER_APP = "vidchain://did-auth";

// Legal Entity
const Entity = {
  iss: "Validated ID",
  aud: "vidchain-api",
  nonce: Buffer.from(crypto.randomBytes(16)).toString("base64"),
  callbackUrl: `${BASE_URL}/demo/backend/notifications`,
  apiKey: API_KEY,
};
const grantType = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const scope = "vidchain profile entity";

export {
  PORT,
  CLIENT_ID_URI,
  BASE_URL,
  SIGNATURES,
  SIGNATURE_VALIDATION,
  REDIS_URL,
  REDIS_PORT,
  HYDRA_URL,
  SESSIONS,
  grantType,
  Entity,
  scope,
  IDENTITY_PROVIDER_APP,
  API_BASE_URL,
  MOCK_TLS_TERMINATION,
  REMEMBER_FOR_TIME,
};
