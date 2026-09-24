import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatDuration, formatDateTimeIndo } from '../common/utils/date.util';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateAgingCategory(dwellHours: number): 'FRESH' | 'NORMAL' | 'WARNING' | 'CRITICAL' {
    if (dwellHours < 24) return 'FRESH';
    if (dwellHours < 72) return 'NORMAL';
    if (dwellHours < 168) return 'WARNING';
    return 'CRITICAL';
  }

  async getAgingOverview(filter?: { customerPt?: string; agingCategory?: string; status?: string }) {
    const whereLot: any = {};

    if (filter?.status && filter.status !== 'ALL') {
      whereLot.status = filter.status;
    }

    if (filter?.customerPt && filter.customerPt !== 'ALL') {
      whereLot.partCustomerStock = {
        customerName: filter.customerPt,
      };
    }

    const lots = await this.prisma.stockLot.findMany({
      where: whereLot,
      include: {
        partCustomerStock: {
          include: {
            part: true,
          },
        },
      },
      orderBy: {
        inTimestamp: 'desc',
      },
      take: 200,
    });

    const now = Date.now();
    let totalActiveLots = 0;
    let totalActiveQty = 0;
    let totalDwellHoursActive = 0;
    let freshCount = 0;
    let normalCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    const formattedLots = lots.map((lot) => {
      const inTime = lot.inTimestamp ? new Date(lot.inTimestamp).getTime() : now;
      const outTime = lot.outTimestamp ? new Date(lot.outTimestamp).getTime() : null;
      const endCalcTime = outTime || now;
      const dwellHours = Math.max(0, Math.round((endCalcTime - inTime) / (1000 * 60 * 60)));
      const dwellDays = Number((dwellHours / 24).toFixed(1));
      const agingCat = this.calculateAgingCategory(dwellHours);
      const isStillIn = lot.status === 'IN_STOCK';

      if (isStillIn) {
        totalActiveLots += 1;
        totalActiveQty += lot.qty;
        totalDwellHoursActive += dwellHours;

        if (agingCat === 'FRESH') freshCount += 1;
        else if (agingCat === 'NORMAL') normalCount += 1;
        else if (agingCat === 'WARNING') warningCount += 1;
        else if (agingCat === 'CRITICAL') criticalCount += 1;
      }

      return {
        id: String(lot.id),
        lotNumber: lot.uniqueTag,
        partNumber: lot.partCustomerStock?.part?.partNumber || '-',
        partName: lot.partCustomerStock?.part?.partName || '-',
        category: lot.partCustomerStock?.part?.category || 'General',
        customerPt: lot.partCustomerStock?.customerName || '-',
        customerPartNumber: lot.partCustomerStock?.customerPartNumber || '-',
        qty: lot.qty,
        status: lot.status,
        originLineOrVendor: lot.lineAsal,
        createdAt: lot.inTimestamp.toISOString(),
        outTimestamp: lot.outTimestamp ? lot.outTimestamp.toISOString() : null,
        dwellHours,
        dwellDays,
        dwellFormatted: formatDuration(lot.inTimestamp, lot.outTimestamp),
        agingCategory: agingCat,
        agingPercentage: Math.min(100, Math.round((dwellHours / 168) * 100)),
      };
    });

    // Apply category filter in memory if requested
    let filteredLots = formattedLots;
    if (filter?.agingCategory && filter.agingCategory !== 'ALL') {
      filteredLots = filteredLots.filter((l) => l.agingCategory === filter.agingCategory);
    }

    const avgDwellHours = totalActiveLots > 0 ? Math.round(totalDwellHoursActive / totalActiveLots) : 0;
    const avgDwellDays = Number((avgDwellHours / 24).toFixed(1));

    return {
      status: 'Berhasil',
      success: true,
      data: {
        summary: {
          totalActiveLots,
          totalActiveQty,
          avgDwellHours,
          avgDwellDays,
          avgDwellFormatted: avgDwellDays > 0 ? `${avgDwellDays} Hari` : `${avgDwellHours} Jam`,
          agingBreakdown: {
            fresh: freshCount,
            normal: normalCount,
            warning: warningCount,
            critical: criticalCount,
          },
        },
        lots: filteredLots,
      },
    };
  }

  async searchTracking(query: string) {
    const q = query.trim();

    // Cari berdasarkan Part Number / Customer Part No / Unique Tag / Part Name
    const part = await this.prisma.masterPart.findFirst({
      where: {
        OR: [
          { partNumber: { equals: q, mode: 'insensitive' } },
          { partNumber: { contains: q, mode: 'insensitive' } },
          { partName: { contains: q, mode: 'insensitive' } },
          {
            customerStocks: {
              some: {
                OR: [
                  { customerPartNumber: { contains: q, mode: 'insensitive' } },
                  { lots: { some: { uniqueTag: { contains: q, mode: 'insensitive' } } } },
                ],
              },
            },
          },
        ],
      },
      include: {
        customerStocks: {
          include: {
            lots: {
              orderBy: { inTimestamp: 'desc' },
            },
            transactions: {
              include: { user: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundException({
        status: 'Gagal',
        success: false,
        message: `Riwayat pergerakan untuk '${q}' tidak ditemukan di database WHFG`,
      });
    }

    const allLots: any[] = [];
    const allTransactions: any[] = [];
    const now = Date.now();

    for (const pcs of part.customerStocks) {
      for (const lot of pcs.lots) {
        const inTime = lot.inTimestamp ? new Date(lot.inTimestamp).getTime() : now;
        const outTime = lot.outTimestamp ? new Date(lot.outTimestamp).getTime() : null;
        const endCalcTime = outTime || now;
        const dwellHours = Math.max(0, Math.round((endCalcTime - inTime) / (1000 * 60 * 60)));
        const dwellDays = Number((dwellHours / 24).toFixed(1));
        const agingCat = this.calculateAgingCategory(dwellHours);

        allLots.push({
          id: String(lot.id),
          lotNumber: lot.uniqueTag,
          partNumber: part.partNumber,
          customerPt: pcs.customerName,
          qty: lot.qty,
          status: lot.status,
          originLineOrVendor: lot.lineAsal,
          createdAt: lot.inTimestamp.toISOString(),
          outTimestamp: lot.outTimestamp ? lot.outTimestamp.toISOString() : null,
          dwellHours,
          dwellDays,
          dwellFormatted: formatDuration(lot.inTimestamp, lot.outTimestamp),
          agingCategory: agingCat,
          agingPercentage: Math.min(100, Math.round((dwellHours / 168) * 100)),
        });
      }

      for (const tx of pcs.transactions) {
        allTransactions.push({
          id: String(tx.id),
          type: tx.transactionType === 'SCAN_IN' || tx.transactionType === 'MANUAL_IN' ? 'IN' : 'OUT',
          transactionType: tx.transactionType,
          partNumber: part.partNumber,
          customerPt: pcs.customerName,
          qty: tx.qty,
          previousStock: tx.previousStock,
          currentStock: tx.currentStock,
          uniqueTag: tx.uniqueTag,
          originLineOrVendor: tx.lineAsal,
          destinationDoorOrPt: pcs.customerName,
          operatorName: tx.user ? `${tx.user.fullName} (${tx.user.npk})` : 'System',
          createdAt: tx.createdAt.toISOString(),
          notes: tx.notes,
        });
      }
    }

    allLots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const formattedPart = {
      id: String(part.id),
      partNumber: part.partNumber,
      partName: part.partName,
      category: part.category,
      location: part.location,
      defaultLine: part.defaultLine,
      standardBoxQty: part.standardQty,
      customerStocks: part.customerStocks.map((cs) => {
        let dynamicStatus: 'UNDER_MIN' | 'OVER_MAX' | 'NORMAL' = 'NORMAL';
        if (cs.minStock > 0 && cs.currentStock <= cs.minStock) {
          dynamicStatus = 'UNDER_MIN';
        } else if (cs.maxStock > 0 && cs.currentStock >= cs.maxStock) {
          dynamicStatus = 'OVER_MAX';
        }

        return {
          id: String(cs.id),
          partNumber: part.partNumber,
          partName: part.partName,
          customerPt: cs.customerName,
          customerPartNumber: cs.customerPartNumber,
          minStock: cs.minStock,
          maxStock: cs.maxStock,
          currentStock: cs.currentStock,
          stockStatus: dynamicStatus,
          category: part.category,
        };
      }),
    };

    return {
      status: 'Berhasil',
      success: true,
      data: {
        part: formattedPart,
        lots: allLots,
        transactions: allTransactions,
      },
    };
  }
}

