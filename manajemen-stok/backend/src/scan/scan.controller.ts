import { Controller, Post, Get, Body, Query, Request } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanDto } from './dto/scan.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('scan')
export class ScanController {
  constructor(
    private readonly scanService: ScanService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('in')
  async scanIn(@Body() dto: ScanDto, @Request() req: any) {
    return this.scanService.processScanIn(dto, req.user);
  }

  @Post('out')
  async scanOut(@Body() dto: ScanDto, @Request() req: any) {
    return this.scanService.processScanOut(dto, req.user);
  }

  @Post('process')
  async processUnifiedScan(@Body() body: any, @Request() req: any) {
    const rawQr = body.rawQrCode || body.qrData;
    const type = body.type || 'IN';
    const location = body.doorOrLineLocation || body.deviceSource;

    if (type === 'OUT') {
      const res = await this.scanService.processScanOut(
        { qrData: rawQr, deviceSource: location },
        req.user,
      );
      return {
        success: true,
        message: res.message,
        transaction: {
          id: res.data.uniqueTag,
          type: 'OUT',
          partNumber: res.data.partNumber,
          customerPt: res.data.customerName,
          qty: res.data.qty,
          originLineOrVendor: '-',
          destinationDoorOrPt: res.data.customerName,
          createdAt: new Date().toISOString(),
        },
        currentStock: res.data.currentStock,
        minStock: res.data.minStock,
        maxStock: res.data.maxStock,
        stockStatus: res.data.stockStatus,
      };
    } else {
      const res = await this.scanService.processScanIn(
        { qrData: rawQr, deviceSource: location },
        req.user,
      );
      return {
        success: true,
        message: res.message,
        transaction: {
          id: res.data.uniqueTag,
          type: 'IN',
          partNumber: res.data.partNumber,
          customerPt: res.data.customerName,
          qty: res.data.qty,
          originLineOrVendor: res.data.lineAsal,
          destinationDoorOrPt: res.data.customerName,
          createdAt: new Date().toISOString(),
        },
        currentStock: res.data.currentStock,
        minStock: res.data.minStock,
        maxStock: res.data.maxStock,
        stockStatus: res.data.stockStatus,
      };
    }
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 15;
    const transactions = await this.prisma.stockTransaction.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        partCustomerStock: {
          include: { part: true },
        },
        user: true,
      },
    });

    return {
      success: true,
      data: transactions.map((t) => ({
        id: String(t.id),
        type: t.transactionType === 'SCAN_IN' || t.transactionType === 'MANUAL_IN' ? 'IN' : 'OUT',
        partNumber: t.partCustomerStock?.part?.partNumber || '-',
        partName: t.partCustomerStock?.part?.partName || '-',
        customerPt: t.partCustomerStock?.customerName || '-',
        qty: t.qty,
        originLineOrVendor: t.lineAsal,
        destinationDoorOrPt: t.partCustomerStock?.customerName,
        operatorName: t.user ? `${t.user.fullName} (${t.user.npk})` : 'System',
        createdAt: t.createdAt.toISOString(),
        notes: t.notes,
      })),
    };
  }
}
