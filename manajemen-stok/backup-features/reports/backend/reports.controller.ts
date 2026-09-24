import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportReportDto } from './dto/export-report.dto';
import { JwtAuthGuard } from '../../../backend/src/auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('export')
  async exportReport(@Body() dto: ExportReportDto, @Res() res: Response) {
    const data = await this.reportsService.generateReport(dto);

    if (dto.format === 'csv') {
      const csv = this.reportsService.convertToCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=laporan_${dto.reportType.toLowerCase()}_${Date.now()}.csv`
      );
      return res.send('\uFEFF' + csv);
    }

    return res.json({ success: true, data });
  }
}
