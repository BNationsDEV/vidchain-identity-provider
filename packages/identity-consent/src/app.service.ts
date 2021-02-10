import {
  Injectable,
  Res,
  Req,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import axios from "axios";
import ERRORS from "./util/error";
import * as hydra from "./services/hydra";
import * as config from "./config";
import { DoConsent, DoLogin, LoginCookie } from "./@types/identityProvider";

function processAccessGranted(challenge: string, body: DoLogin, res: Response) {
  hydra
    .acceptLoginRequest(challenge, {
      // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
      // In our case DID
      subject: body.did,

      // This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
      // set the "skip" parameter in the other route to true on subsequent requests!
      remember: Boolean(body.remember),

      // When the session expires, in seconds. Set this to 0 so it will never expire.
      remember_for: config.REMEMBER_FOR_TIME,

      // Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
      // and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
      // acr: '0',
      // Context is an optional object which can hold arbitrary data. The data will be made available when fetching the
      // consent request under the "context" field. This is useful in scenarios where login and consent endpoints share
      // data.
      context: {
        jwt: body.jwt,
      },
    })
    .then((response) => {
      // All we need to do now is to redirect the user back to hydra!
      res.send(response.redirect_to);
    })
    // This will handle any error that happens when making HTTP calls to hydra
    .catch((error) => {
      throw new BadRequestException(
        `${ERRORS.HYDRA_LOGIN} : ${JSON.stringify((error as Error).message)}`
      );
    });
}

function processDenyAccess(challenge: string, res: Response) {
  hydra
    .rejectLoginRequest(challenge, {
      error: "access_denied",
      error_description: "The resource owner denied the request",
    })
    .then((response) => {
      // All we need to do now is to redirect the browser back to hydra!
      res.redirect(response.redirect_to);
    })
    // This will handle any error that happens when making HTTP calls to hydra
    .catch((error) => {
      throw new BadRequestException(
        `${ERRORS.HYDRA_POST_LOGIN} : ${(error as Error).message}`
      );
    });
}

@Injectable()
export default class AppService {
  checkLogin(
    @Req() req: Request,
    challenge: string,
    @Res() res: Response
  ): void {
    const logger = new Logger("checkLogin");
    hydra
      .getLoginRequest(challenge)
      .then(async (response) => {
        // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate
        // the user.
        if (response.skip) {
          const acceptResponse = await hydra.acceptLoginRequest(challenge, {
            // All we need to do is to confirm that we indeed want to log in the user.
            subject: response.subject,
          });
          res.redirect(acceptResponse.redirect_to);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { cookies } = req;
        // If authentication can't be skipped we MUST show the login UI.
        res.render("index", {
          // eslint-disable-next-line no-underscore-dangle
          csrfToken: (cookies as LoginCookie)._csrf,
          challenge,
          logo_uri: encodeURIComponent(response.client.logo_uri),
          client_name:
            encodeURIComponent(response.client.client_name) ||
            response.client.client_id,
          scope: encodeURIComponent(response.requested_scope),
        });
      })
      // This will handle any error that happens when making HTTP calls to hydra
      .catch((error) => {
        logger.error(
          `${ERRORS.HYDRA_LOGIN} : ${JSON.stringify((error as Error).message)}`
        );
        throw new BadRequestException(
          `${ERRORS.HYDRA_LOGIN} : ${JSON.stringify((error as Error).message)}`
        );
      });
  }

  doLogin(@Req() req: Request, @Res() res: Response): void {
    const body = req.body as DoLogin;
    const { challenge } = body;
    if (body.submit === "Deny access") {
      processDenyAccess(challenge, res);
      return;
    }
    processAccessGranted(challenge, body, res);
  }

  checkConsent(challenge: string, @Res() res: Response): void {
    hydra
      .getConsentRequest(challenge)
      .then((response) => {
        // If a user has granted this application the requested scope, hydra will tell us to not show the UI.
        if (response.skip) {
          // You can apply logic here, for example grant another scope, or do whatever...
          hydra
            .acceptConsentRequest(challenge, {
              // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
              // are requested accidentally.
              grant_scope: response.requested_scope,
              // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
              grant_access_token_audience:
                response.requested_access_token_audience,
              // The session allows us to set session data for id and access tokens
              session: {
                // This data will be available when introspecting the token. Try to avoid sensitive information here,
                // unless you limit who can introspect tokens.
                // access_token: { foo: 'bar' },

                // This data will be available in the ID token.
                id_token: {
                  jwt: response.context.jwt,
                },
              },
            })
            .then((responseAccept) => {
              res.redirect(responseAccept.redirect_to);
            })
            .catch((error) => {
              throw new BadRequestException(
                `${ERRORS.HYDRA_CONSENT} : ${(error as Error).message}`
              );
            });
        }
        if (!response.skip) {
          const body = {
            challenge,
            remember: false,
            grant_scope: response.requested_scope,
            jwt: response.context.jwt,
          };
          const logger = new Logger("checkConsent");
          axios
            .post(`${config.BASE_URL}/consent`, body)
            .then((result) => {
              res.redirect(result.data);
            })
            .catch((error) =>
              logger.error(
                `${ERRORS.HYDRA_CONSENT} : ${(error as Error).message}`
              )
            );
        }
      })
      .catch((error) => {
        throw new BadRequestException(
          `${ERRORS.HYDRA_CONSENT} : ${(error as Error).message}`
        );
      });
  }

  doConsent(@Req() req: Request, @Res() res: Response): void {
    const body = req.body as DoConsent;
    const { challenge } = body;
    // If this request has been performed, the user has already accepted to login in the wallet

    // eslint-disable-next-line @typescript-eslint/naming-convention
    let { grant_scope } = body;
    if (!Array.isArray(grant_scope)) {
      grant_scope = [grant_scope];
    }
    // Seems like the user authenticated! Let's tell hydra...
    hydra
      .getConsentRequest(challenge)
      .then(async (response) => {
        return hydra
          .acceptConsentRequest(challenge, {
            // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
            // are requested accidentally.
            grant_scope,
            // The session allows us to set session data for id and access tokens
            session: {
              // This data will be available when introspecting the token. Try to avoid sensitive information here,
              // unless you limit who can introspect tokens.
              // access_token: { foo: 'bar' },

              // This data will be available in the ID token.
              // id_token: { baz: 'bar' },
              id_token: {
                jwt: response.context.jwt,
              },
            },
            // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
            grant_access_token_audience:
              response.requested_access_token_audience,
            // This tells hydra to remember this consent request and allow the same client to request the same
            // scopes from the same user, without showing the UI, in the future.
            remember: Boolean(body.remember),
            // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
            remember_for: config.REMEMBER_FOR_TIME,
          })
          .then((responseAccept) => {
            res.send(responseAccept.redirect_to);
          });
      })
      // This will handle any error that happens when making HTTP calls to hydra
      .catch((error) => {
        throw new BadRequestException(
          `${ERRORS.HYDRA_POST_CONSENT} : ${(error as Error).message}`
        );
      });
  }
}
