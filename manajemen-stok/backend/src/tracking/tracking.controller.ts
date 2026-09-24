import { Controller, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':query')
  async searchTracking(@Param('query') query: string) {
    return this.trackingService.searchTracking(query);
  }
}
