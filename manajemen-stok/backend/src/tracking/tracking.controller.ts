import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('overview')
  async getAgingOverview(
    @Query('customerPt') customerPt?: string,
    @Query('agingCategory') agingCategory?: string,
    @Query('status') status?: string,
  ) {
    return this.trackingService.getAgingOverview({ customerPt, agingCategory, status });
  }

  @Get(':query')
  async searchTracking(@Param('query') query: string) {
    return this.trackingService.searchTracking(query);
  }
}

