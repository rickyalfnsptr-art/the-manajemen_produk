import { Controller, Get, Patch, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MasterPartsService } from './master-parts.service';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('master-parts')
export class MasterPartsController {
  constructor(private readonly masterPartsService: MasterPartsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('customerName') customerName?: string,
    @Query('line') line?: string,
    @Query('location') location?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.masterPartsService.findAll({
      search,
      category,
      customerName,
      line,
      location,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('metadata')
  async getMetadata() {
    return this.masterPartsService.getMetadata();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.masterPartsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('threshold/:id')
  async updateThreshold(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThresholdDto,
  ) {
    return this.masterPartsService.updatePtThreshold(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('allocation')
  async createOrAssignAllocation(
    @Body()
    dto: {
      partNumber: string;
      partName: string;
      category?: string;
      customerName: string;
      customerPartNumber?: string;
      minStock: number;
      maxStock: number;
    },
  ) {
    return this.masterPartsService.createOrAssignAllocation(dto);
  }
}
