const PORT = 3000;
const BASE_URL = 'http://localhost:3000'
const SIOP_PATH = '/siop'
const RETURN_CALL = '/responses'

const SIGNATURES = "https://api.intebsi.xyz/wallet/v1/signatures"
const SIGNATURE_VALIDATION = "https://api.intebsi.xyz/wallet/v1/signature-validations";

//For now factory matters enterprise wallet
const authZToken = "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QiLCJraWQiOiJZemxBY0l4RnVqVVd0Rjk4V1lxaGxPUlA2ME1NcF9ZX0hYRl8ySHI3X3E0In0.eyJkaWQiOiJkaWQ6ZWJzaToweEE4MzdGNjI3RURDYTlDNkIyNDQzN0UyOTRGMjFjNjJjNDE0RjZFNGMiLCJhdWQiOiJlYnNpLXdhbGxldCIsIm5vbmNlIjoiNWJjZWFkYWUtYTg1ZC00NjZiLTliNWEtMDc4YjcwM2MzZDIzIiwic3ViIjoiQ09NUEFOWSBBQSBJTkMiLCJpYXQiOjE1OTEwMjk2ODQsImV4cCI6MTYwMDAyOTY4NH0.96CE_auzr_gJTyg8dyhSINpPICkAQ9LvNibl-hq9hUMZ2KTyr-9zBDjSwHYEbRZtbNGAz0LPANy_0PCwrH32og";
const DID = "did:ebsi:0xA837F627EDCa9C6B24437E294F21c62c414F6E4c"

// client_id return call_back
const CLIENT_ID_URI = BASE_URL + SIOP_PATH + RETURN_CALL

export {PORT,CLIENT_ID_URI, BASE_URL, SIGNATURES, SIGNATURE_VALIDATION, authZToken, DID}