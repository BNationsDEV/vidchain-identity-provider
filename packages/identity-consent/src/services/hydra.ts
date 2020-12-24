import fetch from "node-fetch";
import querystring from "querystring";
import { HttpException, Logger } from "@nestjs/common";
import { HYDRA_URL, MOCK_TLS_TERMINATION } from "../config";
import {
  ConsentAcceptResponse,
  ConsentRequestResponse,
  LoginAcceptResponse,
  LoginRejectResponse,
  LoginRequestResponse,
} from "../@types/identityProvider";

const hydraUrl = HYDRA_URL;
let mockTlsTermination = {};

if (MOCK_TLS_TERMINATION) {
  mockTlsTermination = {
    "X-Forwarded-Proto": "https",
  };
}

// A little helper that takes type (can be "login" or "consent") and a challenge and returns the response from ORY Hydra.
const get = async (flow: string, challenge: string): Promise<unknown> => {
  const logger = new Logger("Hydra: get");
  const url = new URL(`/oauth2/auth/requests/${flow}`, hydraUrl);
  url.search = querystring.stringify({ [`${flow}_challenge`]: challenge });
  logger.debug(`going to fetch put: ${url.toString()}`);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      ...mockTlsTermination,
    },
  });
  if (res.status < 200 || res.status > 302) {
    // This will handle any errors that aren't network related (network related errors are handled automatically)
    return res.json().then((body) => {
      logger.error("An error occurred while making a HTTP request: ", body);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return Promise.reject(new HttpException(body.error.message, res.status));
    });
  }
  return res.json();
};

// A little helper that takes type (can be "login" or "consent"), the action (can be "accept" or "reject") and a challenge and returns the response from ORY Hydra.
const put = async (
  flow: string,
  action: string,
  challenge: string,
  body: Record<string, unknown>
): Promise<unknown> => {
  const logger = new Logger("Hydra: put");
  const url = new URL(`/oauth2/auth/requests/${flow}/${action}`, hydraUrl);
  url.search = querystring.stringify({ [`${flow}_challenge`]: challenge });
  logger.debug(`going to fetch put: ${url.toString()}`);
  return fetch(
    // Joins process.env.HYDRA_ADMIN_URL with the request path
    url.toString(),
    {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...mockTlsTermination,
      },
    }
    // eslint-disable-next-line func-names
  ).then(async (res) => {
    // console.log("response put");
    // console.log(res.status);
    if (res.status < 200 || res.status > 302) {
      // This will handle any errors that aren't network related (network related errors are handled automatically)
      // eslint-disable-next-line func-names
      return res.json().then(function (bodyResponse) {
        logger.error(
          "An error occurred while making a HTTP request: ",
          bodyResponse
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return Promise.reject(new Error((bodyResponse.error as Error).message));
      });
    }

    return res.json();
  });
};

// Fetches information on a login request.
export async function getLoginRequest(
  challenge: string
): Promise<LoginRequestResponse> {
  return (await get("login", challenge)) as LoginRequestResponse;
}
// Accepts a login request.
export async function acceptLoginRequest(
  challenge: string,
  body: Record<string, unknown>
): Promise<LoginAcceptResponse> {
  return (await put("login", "reject", challenge, body)) as LoginAcceptResponse;
}
// Rejects a login request.
export async function rejectLoginRequest(
  challenge: string,
  body: Record<string, unknown>
): Promise<LoginRejectResponse> {
  return (await put("login", "reject", challenge, body)) as LoginRejectResponse;
}
// Fetches information on a consent request.
export async function getConsentRequest(
  challenge: string
): Promise<ConsentRequestResponse> {
  return (await get("consent", challenge)) as ConsentRequestResponse;
}
// Accepts a consent request.
export async function acceptConsentRequest(
  challenge: string,
  body: Record<string, unknown>
): Promise<ConsentAcceptResponse> {
  return (await put(
    "consent",
    "accept",
    challenge,
    body
  )) as ConsentAcceptResponse;
}
// Rejects a consent request.
export async function rejectConsentRequest(
  challenge: string,
  body: Record<string, unknown>
): Promise<unknown> {
  return put("consent", "reject", challenge, body);
}
// Fetches information on a logout request.
export async function getLogoutRequest(challenge: string): Promise<unknown> {
  return get("logout", challenge);
}
// Accepts a logout request.
export async function acceptLogoutRequest(challenge: string): Promise<unknown> {
  return put("logout", "accept", challenge, {});
}
// Reject a logout request.
export async function rejectLogoutRequest(challenge: string): Promise<unknown> {
  return put("logout", "reject", challenge, {});
}
