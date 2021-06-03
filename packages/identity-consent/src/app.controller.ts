import { Controller, Get, Req, Res, Post, Query } from "@nestjs/common";
import { Response, Request } from "express";
import AppService from "./app.service";

import jsonFile from "./templates/apple-app-site-association.json";

@Controller()
export default class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("login")
  checkLogin(
    @Req() req: Request,
    @Query("login_challenge") challenge: string,
    @Res() res: Response
  ): void {
    // The challenge is used to fetch information about the login request from ORY Hydra.
    return this.appService.checkLogin(req, challenge, res);
  }

  @Post("login")
  doLogin(@Req() req: Request, @Res() res: Response): void {
    return this.appService.doLogin(req, res);
  }

  @Get("consent")
  checkConsent(
    @Query("consent_challenge") challenge: string,
    @Res() res: Response
  ): void {
    return this.appService.checkConsent(challenge, res);
  }

  @Post("consent")
  doConsent(@Req() req: Request, @Res() res: Response): void {
    return this.appService.doConsent(req, res);
  }

  @Get("apple-app-site-association")
  appleJSON(@Req() req: Request, @Res() res: Response): void {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(jsonFile));
  }
}
