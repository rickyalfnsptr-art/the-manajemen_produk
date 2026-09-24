import { Module } from '@nestjs/common';
import { MasterPartsService } from './master-parts.service';
import { MasterPartsController } from './master-parts.controller';

@Module({
  controllers: [MasterPartsController],
  providers: [MasterPartsService],
  exports: [MasterPartsService],
})
export class MasterPartsModule {}
