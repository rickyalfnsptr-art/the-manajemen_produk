import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { StockService } from './stock.service';
import { ManualInputDto } from './dto/manual-input.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('customer-pts')
  async getCustomerPts() {
    const pts = await this.stockService.getCustomerPts();
    return { success: true, data: pts };
  }

  @Get('monitoring')
  async getMonitoring(
    @Query('customerName') customerName?: string,
    @Query('customerPt') customerPt?: string,
    @Query('statusFilter') statusFilter?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockService.getMonitoringData({
      customerName: customerPt || customerName,
      statusFilter,
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 500,
    });
  }

  @Get('statistics')
  async getStatistics(@Query('customerName') customerName?: string, @Query('customerPt') customerPt?: string) {
    return this.stockService.getStatistics(customerPt || customerName);
  }

  @Post('manual')
  async manualInput(@Body() dto: any, @Request() req: any) {
    return this.stockService.processManualInput(dto, req.user);
  }

  @Post('manual-input')
  async manualInputAlias(@Body() dto: any, @Request() req: any) {
    return this.stockService.processManualInput(dto, req.user);
  }
}
