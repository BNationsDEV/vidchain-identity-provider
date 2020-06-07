const PORT: number = +process.env.PORT || 3000;
const BASE_URL = process.env.PORT || 'http://localhost:3000'

const SIOP_PATH = '/siop'
const RETURN_CALL = '/responses'

// client_id return callBack
const CLIENT_ID_URI = BASE_URL + SIOP_PATH + RETURN_CALL

const REDIS_URL = process.env.REDIS_URL || ""
const REDIS_PORT: number = +process.env.REDIS_PORT || 6379

const HYDRA_URL = process.env.HYDRA_URL || "http://127.0.0.1:9001"

const SIGNATURES = "https://dev.api.vidchain.net/api/v1/signatures"
const SIGNATURE_VALIDATION = "https://dev.api.vidchain.net/api/v1/signature-validations";

//For now hardcoding enterprise wallet
const authZToken = "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QiLCJraWQiOiJ2aWRjaGFpbi1hcGkifQ.eyJzdWIiOiJWSURURVNUIElOQy4iLCJkaWQiOiJkaWQ6dmlkOjB4ZTZiNjk2RTJGNEQyYjM2M0EwMjYxNThENTBFM0E4NTlEMTI3MDZlZiIsIm5vbmNlIjoiei0wNDI3ZGMyNTE2ZDAiLCJpYXQiOjE1OTExMDE1NzcsImV4cCI6MTU5MzY5MzU3NywiYXVkIjoidmlkY2hhaW4tYXBpIn0.fS5WRFC2CJ0bCPxVLlDRVcWv4ZyJdfYu1P42xSkH678W7U1EzrlVATusBOSRyC7wRCIdqp_pQ5UQSlS9r7K0Kg";
const DID = "did:vid:0xe6b696E2F4D2b363A026158D50E3A859D12706ef"

export {PORT,CLIENT_ID_URI, BASE_URL, SIGNATURES, SIGNATURE_VALIDATION, authZToken, DID, REDIS_URL, REDIS_PORT, HYDRA_URL}
