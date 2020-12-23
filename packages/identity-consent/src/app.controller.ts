import { Controller, Get, Req, Res, Post, Query } from "@nestjs/common";
import { Response, Request } from "express";
import AppService from "./app.service";

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
}
