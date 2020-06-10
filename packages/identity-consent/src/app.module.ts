import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import VidDidAuth from './did-auth/src/VidDIDAuth';
import { SiopModule } from './siop/siop.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [VidDidAuth, SiopModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
