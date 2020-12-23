enum ERRORS {
  HYDRA_LOGIN = "Something wrong happens when start the Login request.",
  HYDRA_POST_LOGIN = "Something wrong happens when request the Login.",
  HYDRA_CONSENT = "Something wrong happens when start the Consent request.",
  HYDRA_POST_CONSENT = "Something wrong happens when request the Consent.",
  SESSION = "Error connecting to the VIDchain API.",
  LOGIN_QUERY_PARAMS_NOT_DEFINED = "Query parameters not defined on login request",
  NO_KID_FOUND = "Token did not have kid.",
  NO_REDIS_JWT_FOUND = "JWT token not found on Redis",
  NO_REDIS_CLIENTS_FOUND = "Client not found on Redis",
  NO_REQUEST_JWT_CREATED = "Error creating the Request JWT",
  NO_URL_ENCODED = "No URL Encoded on Request Token",
}

export default ERRORS;
