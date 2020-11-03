// CONFIG PROJECT FILE
import * as dotenv from "dotenv";
// importing .env variables
dotenv.config();

const PORT: number = + process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const SIOP_PATH = '/siop'
const RETURN_CALL = '/responses'

// client_id return callBack
const CLIENT_ID_URI = BASE_URL + SIOP_PATH + RETURN_CALL

const REDIS_URL = process.env.REDIS_URL || ""
const REDIS_PORT: number = + process.env.REDIS_PORT || 6379

const HYDRA_URL = process.env.HYDRA_URL || "http://127.0.0.1:9001"

const SIGNATURES = process.env.API_URL + "/api/v1/signatures"
const SIGNATURE_VALIDATION = process.env.API_URL + "/api/v1/signature-validations";
const SESSIONS = process.env.API_URL + "/api/v1/sessions"

//Legal Entity
const grantType = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const assertion = "ewoiaXNzIjogIlZJRFRFU1QgSU5DLiIsCiJhdWQiOiAidmlkY2hhaW4tYXBpIiwKIm5vbmNlIjogInotMDQyN2RjMjUxNmQwIgp9";
const scope = "vidchain profile test entity";

export {PORT,CLIENT_ID_URI, BASE_URL, SIGNATURES, SIGNATURE_VALIDATION, REDIS_URL, REDIS_PORT, HYDRA_URL, SESSIONS, grantType, assertion, scope}
