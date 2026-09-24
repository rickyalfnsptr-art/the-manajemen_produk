import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatDuration, formatDateTimeIndo } from '../common/utils/date.util';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async searchTracking(query: string) {
    const q = query.trim();

    // Cari berdasarkan Part Number / Unique Tag
    const part = await this.prisma.masterPart.findFirst({
      where: {
        OR: [
          { partNumber: { equals: q, mode: 'insensitive' } },
          { partNumber: { contains: q, mode: 'insensitive' } },
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

    for (const pcs of part.customerStocks) {
      for (const lot of pcs.lots) {
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
          dwellHours: lot.inTimestamp
            ? Math.round(((lot.outTimestamp ? lot.outTimestamp.getTime() : Date.now()) - lot.inTimestamp.getTime()) / (1000 * 60 * 60))
            : 0,
        });
      }

      for (const tx of pcs.transactions) {
        allTransactions.push({
          id: String(tx.id),
          type: tx.transactionType === 'SCAN_IN' || tx.transactionType === 'MANUAL_IN' ? 'IN' : 'OUT',
          partNumber: part.partNumber,
          customerPt: pcs.customerName,
          qty: tx.qty,
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
      standardBoxQty: part.standardQty,
      customerStocks: part.customerStocks.map((cs) => ({
        id: String(cs.id),
        partNumber: part.partNumber,
        partName: part.partName,
        customerPt: cs.customerName,
        minStock: cs.minStock,
        maxStock: cs.maxStock,
        currentStock: cs.currentStock,
        stockStatus: cs.stockStatus === 'RED_MIN' ? 'UNDER_MIN' : cs.stockStatus === 'RED_MAX' ? 'OVER_MAX' : 'NORMAL',
        category: part.category,
      })),
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
