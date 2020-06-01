import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import EBSIDIDAuth from './did-auth/src/EBSIDIDAuth';
import { SiopModule } from './siop/siop.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [EBSIDIDAuth, SiopModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
