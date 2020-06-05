import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'siop',
      redis: {
        host: 'redis',
        port: 6379,
      },
    }, {
      name: 'siopError',
      redis: {
        host: 'redis',
        port: 6379,
      },
    })
  ],
  providers: [EventsGateway],
})
export class EventsModule {}