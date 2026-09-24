import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../backend/src/prisma/prisma.service';
import { ExportReportDto, ReportType } from './dto/export-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(dto: ExportReportDto) {
    switch (dto.reportType) {
      case ReportType.MONTHLY_MUTATION:
        return this.getMonthlyMutationReport(dto);
      case ReportType.AUDIT_LOG:
        return this.getAuditLogReport(dto);
      case ReportType.STOCK_EVALUATION:
        return this.getStockEvaluationReport(dto);
      case ReportType.AGING_DWELL_TIME:
        return this.getAgingDwellTimeReport(dto);
      default:
        throw new Error('Jenis laporan tidak dikenal.');
    }
  }

  // 1. Laporan Mutasi Bulanan
  private async getMonthlyMutationReport(dto: ExportReportDto) {
    const where: any = {};
    if (dto.customerPt) {
      where.customerPt = dto.customerPt;
    }
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const txs = await this.prisma.stockTransaction.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate summary per Part & Customer PT
    const summaryMap: Record<string, any> = {};

    for (const tx of txs) {
      const key = `${tx.partNumber}__${tx.customerPt}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          partNumber: tx.partNumber,
          customerPt: tx.customerPt,
          totalIn: 0,
          totalOut: 0,
          netMutation: 0,
        };
      }
      if (tx.type === 'IN') {
        summaryMap[key].totalIn += tx.qty;
      } else {
        summaryMap[key].totalOut += tx.qty;
      }
      summaryMap[key].netMutation = summaryMap[key].totalIn - summaryMap[key].totalOut;
    }

    return {
      type: 'MONTHLY_MUTATION',
      generatedAt: new Date().toISOString(),
      summary: Object.values(summaryMap),
      transactions: txs,
    };
  }

  // 2. Laporan Audit Log & Scan Duplikat/Gagal
  private async getAuditLogReport(dto: ExportReportDto) {
    const where: any = {};
    if (dto.customerPt) {
      where.customerPt = dto.customerPt;
    }
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return {
      type: 'AUDIT_LOG',
      generatedAt: new Date().toISOString(),
      logs,
    };
  }

  // 3. Laporan Evaluasi Batas Min/Max
  private async getStockEvaluationReport(dto: ExportReportDto) {
    const where: any = {};
    if (dto.customerPt) {
      where.customerPt = dto.customerPt;
    }

    const stocks = await this.prisma.partCustomerStock.findMany({
      where,
      include: {
        part: true,
      },
      orderBy: [{ stockStatus: 'desc' }, { partNumber: 'asc' }],
    });

    const evaluated = stocks.map((s) => ({
      partNumber: s.partNumber,
      partName: s.part.partName,
      category: s.part.category,
      customerPt: s.customerPt,
      minStock: s.minStock,
      maxStock: s.maxStock,
      currentStock: s.currentStock,
      stockStatus: s.stockStatus,
      statusLabel:
        s.stockStatus === 'UNDER_MIN'
          ? 'Kritis (<= Min)'
          : s.stockStatus === 'OVER_MAX'
          ? 'Overstock (>= Max)'
          : 'Normal (Min < Stok < Max)',
      actionRecommendation:
        s.stockStatus === 'UNDER_MIN'
          ? 'Restock Segera dari Line/Vendor'
          : s.stockStatus === 'OVER_MAX'
          ? 'Prioritaskan Delivery OUT ke Customer'
          : 'Kondisi Stok Optimal',
    }));

    return {
      type: 'STOCK_EVALUATION',
      generatedAt: new Date().toISOString(),
      data: evaluated,
    };
  }

  // 4. Laporan Aging / Dwell Time
  private async getAgingDwellTimeReport(dto: ExportReportDto) {
    const where: any = {};
    if (dto.customerPt) {
      where.customerPt = dto.customerPt;
    }

    const lots = await this.prisma.stockLot.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date().getTime();

    const agingData = lots.map((lot) => {
      const inTime = new Date(lot.createdAt).getTime();
      const outTime = lot.outTimestamp ? new Date(lot.outTimestamp).getTime() : now;
      const dwellHours = Math.round((outTime - inTime) / (1000 * 60 * 60));
      const dwellDays = (dwellHours / 24).toFixed(1);

      return {
        lotNumber: lot.lotNumber,
        partNumber: lot.partNumber,
        customerPt: lot.customerPt,
        qty: lot.qty,
        status: lot.status,
        inTimestamp: lot.createdAt,
        outTimestamp: lot.outTimestamp,
        originLineOrVendor: lot.originLineOrVendor,
        dwellHours,
        dwellDays,
        agingCategory:
          dwellHours > 72
            ? '> 3 Hari (Slow Moving / Perhatian)'
            : dwellHours > 24
            ? '1 - 3 Hari (Standar)'
            : '< 24 Jam (Fast Moving)',
      };
    });

    return {
      type: 'AGING_DWELL_TIME',
      generatedAt: new Date().toISOString(),
      data: agingData,
    };
  }

  // Helper to convert report data to CSV string
  convertToCsv(report: any): string {
    if (!report || !report.type) return '';

    if (report.type === 'MONTHLY_MUTATION') {
      const headers = ['Part Number', 'Customer PT', 'Total IN (pcs)', 'Total OUT (pcs)', 'Net Mutasi (pcs)'];
      const rows = (report.summary || []).map((item: any) => [
        `"${item.partNumber}"`,
        `"${item.customerPt}"`,
        item.totalIn,
        item.totalOut,
        item.netMutation,
      ]);
      return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    }

    if (report.type === 'STOCK_EVALUATION') {
      const headers = [
        'Part Number',
        'Nama Part',
        'Kategori',
        'Customer PT',
        'Min Stock',
        'Max Stock',
        'Stok Aktual',
        'Status',
        'Rekomendasi',
      ];
      const rows = (report.data || []).map((item: any) => [
        `"${item.partNumber}"`,
        `"${item.partName}"`,
        `"${item.category || '-'}"`,
        `"${item.customerPt}"`,
        item.minStock,
        item.maxStock,
        item.currentStock,
        `"${item.statusLabel}"`,
        `"${item.actionRecommendation}"`,
      ]);
      return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    }

    if (report.type === 'AGING_DWELL_TIME') {
      const headers = [
        'Lot Number',
        'Part Number',
        'Customer PT',
        'Qty (pcs)',
        'Status Lot',
        'Waktu IN',
        'Waktu OUT',
        'Durasi Simpan (Jam)',
        'Durasi Simpan (Hari)',
        'Kategori Aging',
      ];
      const rows = (report.data || []).map((item: any) => [
        `"${item.lotNumber}"`,
        `"${item.partNumber}"`,
        `"${item.customerPt}"`,
        item.qty,
        `"${item.status}"`,
        `"${new Date(item.inTimestamp).toLocaleString('id-ID')}"`,
        item.outTimestamp ? `"${new Date(item.outTimestamp).toLocaleString('id-ID')}"` : '"Sedang di WHFG"',
        item.dwellHours,
        item.dwellDays,
        `"${item.agingCategory}"`,
      ]);
      return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    }

    if (report.type === 'AUDIT_LOG') {
      const headers = ['Waktu', 'Aksi', 'Hasil', 'Part Number', 'Customer PT', 'Operator NPK', 'Detail Pesan'];
      const rows = (report.logs || []).map((l: any) => [
        `"${new Date(l.createdAt).toLocaleString('id-ID')}"`,
        `"${l.action}"`,
        `"${l.status}"`,
        `"${l.partNumber || '-'}"`,
        `"${l.customerPt || '-'}"`,
        `"${l.userNpk || 'System'}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    }

    return '';
  }
}
