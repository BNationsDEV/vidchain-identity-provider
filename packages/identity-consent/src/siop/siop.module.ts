import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EbsiDidAuth} from '../did-auth/src/index';
import { SiopController } from './siop.controller';
import { SiopProcessor } from './siop.processor';

@Module({
  imports: [
    EbsiDidAuth,
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
  controllers: [SiopController],
  providers: [SiopProcessor],
})
export class SiopModule {}
