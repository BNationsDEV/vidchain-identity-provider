import { Injectable } from '@nestjs/common';
import { Res, Req,Request, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ERRORS } from './util/error'
import * as hydra from './services/hydra';
import axios from "axios";
import * as config from './config';

@Injectable()
export class AppService {
  constructor() {}
  private readonly logger = new Logger(AppService.name);

  checkLogin(@Request() req, @Res() res: Response) {
    const query = req.query;
    // The challenge is used to fetch information about the login request from ORY Hydra.
    var challenge = query.login_challenge;

    hydra.getLoginRequest(challenge)
      .then(function (response) {
        // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate
        // the user.
        if (response.skip) {
          return hydra.acceptLoginRequest(challenge, {
            // All we need to do is to confirm that we indeed want to log in the user.
            subject: response.subject
          }).then(function (response) {
            res.redirect(response.redirect_to);
          });
        }
        // If authentication can't be skipped we MUST show the login UI.
        res.render('index', {
          csrfToken: req.cookies._csrf,
          challenge: challenge,
        });
      })
      // This will handle any error that happens when making HTTP calls to hydra
      .catch(function (error) {
        throw new BadRequestException(ERRORS.HYDRA_LOGIN)
      });
  }

  async doLogin(@Req() req, @Res() res: Response) {
    var body = req.body;
    var challenge = body.challenge;
    // In fact, if this request has been performed, the user has already accepted to login in the wallet
    
    // Let's see if the user decided to accept or reject the consent request.. 
    // Never happens in our flow (yet)
    if (body.submit === 'Deny access') {
      // Looks like the consent request was denied by the user
      return hydra.rejectLoginRequest(challenge, {
        error: 'access_denied',
        error_description: 'The resource owner denied the request'
      })
        .then(function (response) {
          // All we need to do now is to redirect the browser back to hydra!
          res.redirect(response.redirect_to);
        })
        // This will handle any error that happens when making HTTP calls to hydra
        .catch(function (error) {
          throw new BadRequestException(ERRORS.HYDRA_POST_LOGIN)
        });
    }
    hydra.acceptLoginRequest(challenge, {
      // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
      //In our case DID
      subject: body.did,
  
      // This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
      // set the "skip" parameter in the other route to true on subsequent requests!
      remember: Boolean(body.remember),
  
      // When the session expires, in seconds. Set this to 0 so it will never expire.
      remember_for: 3600,
  
      // Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
      // and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
      // acr: '0',
    })
      .then(function (response) {
        // All we need to do now is to redirect the user back to hydra!
        res.send(response.redirect_to);
      })
      // This will handle any error that happens when making HTTP calls to hydra
      .catch(function (error) {
        throw new BadRequestException(ERRORS.HYDRA_LOGIN)
      });
  }

  checkConsent(@Request() req, @Res() res: Response) {
    const query = req.query;
    var challenge = query.consent_challenge;
    hydra.getConsentRequest(challenge)
      .then(function (response) {
        // If a user has granted this application the requested scope, hydra will tell us to not show the UI.
        if (response.skip) {
          // You can apply logic here, for example grant another scope, or do whatever...
          return hydra.acceptConsentRequest(challenge, {
            // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
            // are requested accidentally.
            grant_scope: response.requested_scope,
            // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
            grant_access_token_audience: response.requested_access_token_audience,
            // The session allows us to set session data for id and access tokens
            session: {
              // This data will be available when introspecting the token. Try to avoid sensitive information here,
              // unless you limit who can introspect tokens.
              //access_token: { foo: 'bar' },

              // This data will be available in the ID token.
              //id_token: { baz: 'bar' },
            }
          }).then(function (response) {
            res.redirect(response.redirect_to);
          });
        }
        
        const body = {
          challenge: challenge,
          remember: true,
          grant_scope: response.requested_scope
        };

      axios.post(config.BASE_URL, body)
          .then ((result)=> {
          console.log(result);
          res.redirect(result.data);
        })
          .catch ((error)=> console.log(error))
          
      })
      .catch(function (error) {
        throw new BadRequestException(ERRORS.HYDRA_CONSENT)
      });

  } 

  doConsent(@Req() req, @Res() res: Response) {
    var body = req.body;
    var challenge = body.challenge;
    // If this request has been performed, the user has already accepted to login in the wallet

    var grant_scope = body.grant_scope
    if (!Array.isArray(grant_scope)) {
      grant_scope = [grant_scope]
    }
    // Seems like the user authenticated! Let's tell hydra...
    hydra.getConsentRequest(challenge)
      .then(function (response) {
        return hydra.acceptConsentRequest(challenge, {
          // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
          // are requested accidentally.
          grant_scope: grant_scope,
          // The session allows us to set session data for id and access tokens
          session: {
            // This data will be available when introspecting the token. Try to avoid sensitive information here,
            // unless you limit who can introspect tokens.
            //access_token: { foo: 'bar' },

            // This data will be available in the ID token.
            //id_token: { baz: 'bar' },
          },
          // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
          grant_access_token_audience: response.requested_access_token_audience,
          // This tells hydra to remember this consent request and allow the same client to request the same
          // scopes from the same user, without showing the UI, in the future.
          remember: Boolean(req.body.remember),
          // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
          remember_for: 3600,
        })
          .then(function (response) {
            res.send(response.redirect_to);
          })
      })
      // This will handle any error that happens when making HTTP calls to hydra
      .catch(function (error) {
        throw new BadRequestException(ERRORS.HYDRA_POST_CONSENT)
      });
  }
}
