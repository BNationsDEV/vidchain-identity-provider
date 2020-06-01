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
    }, {
      name: 'siopError',
    })
  ],
  controllers: [SiopController],
  providers: [SiopProcessor],
})
export class SiopModule {}
