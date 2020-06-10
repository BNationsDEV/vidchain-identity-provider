import { Controller, Get, Body, Render, Req, Res, Post } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('login')
  checkLogin(@Req() req, @Res() res: Response): void {
    return this.appService.checkLogin(req, res);
  }

  @Post('login')
  async doLogin(@Req() req, @Res() res: Response): Promise<void> {
    return await this.appService.doLogin(req, res);
  }

  @Get('consent')
  checkConsent(@Req() req, @Res() res: Response): void {
    return this.appService.checkConsent(req, res);
  }

  @Post('consent')
  doConsent(@Req() req, @Res() res: Response): void {
    return this.appService.doConsent(req, res);
  }
}
