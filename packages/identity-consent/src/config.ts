const PORT = 3000;
const BASE_URL = 'https://dev.api.vidchain.net'
const SIOP_PATH = '/siop'
const RETURN_CALL = '/responses'

const SIGNATURES = "https://dev.api.vidchain.net/api/v1/signatures"
const SIGNATURE_VALIDATION = "https://dev.api.vidchain.net/api/v1/signature-validations";

//For now hardcoding enterprise wallet
const authZToken = "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QiLCJraWQiOiJ2aWRjaGFpbi1hcGkifQ.eyJzdWIiOiJWSURURVNUIElOQy4iLCJkaWQiOiJkaWQ6dmlkOjB4ZTZiNjk2RTJGNEQyYjM2M0EwMjYxNThENTBFM0E4NTlEMTI3MDZlZiIsIm5vbmNlIjoiei0wNDI3ZGMyNTE2ZDAiLCJpYXQiOjE1OTExMDE1NzcsImV4cCI6MTU5MzY5MzU3NywiYXVkIjoidmlkY2hhaW4tYXBpIn0.fS5WRFC2CJ0bCPxVLlDRVcWv4ZyJdfYu1P42xSkH678W7U1EzrlVATusBOSRyC7wRCIdqp_pQ5UQSlS9r7K0Kg";
const DID = "did:vid:0xe6b696E2F4D2b363A026158D50E3A859D12706ef"

// client_id return call_back
const CLIENT_ID_URI = BASE_URL + SIOP_PATH + RETURN_CALL

export {PORT,CLIENT_ID_URI, BASE_URL, SIGNATURES, SIGNATURE_VALIDATION, authZToken, DID}
