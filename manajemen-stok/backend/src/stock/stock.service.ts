import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManualInputDto } from './dto/manual-input.dto';
import { StockStatus, TransactionType, LotStatus } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerPts(): Promise<string[]> {
    const pts = await this.prisma.partCustomerStock.findMany({
      select: { customerName: true },
      distinct: ['customerName'],
      orderBy: { customerName: 'asc' },
    });
    return pts.map((p) => p.customerName);
  }

  async getMonitoringData(params: {
    customerName?: string;
    customerPt?: string;
    statusFilter?: string; // ALL, WARNING, NORMAL, RED_MIN, RED_MAX
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { customerName, customerPt, statusFilter, category, search, page = 1, limit = 500 } = params;
    const targetPt = customerPt || customerName;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (targetPt && targetPt !== 'ALL' && targetPt.trim() !== '') {
      where.customerName = { contains: targetPt, mode: 'insensitive' };
    }

    if (category && category !== 'ALL') {
      where.part = { category };
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { part: { partNumber: { contains: q, mode: 'insensitive' } } },
        { part: { partName: { contains: q, mode: 'insensitive' } } },
        { customerPartNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'WARNING') {
        where.stockStatus = { in: [StockStatus.RED_MIN, StockStatus.RED_MAX] };
      } else if (statusFilter === 'NORMAL' || statusFilter === 'GREEN_NORMAL') {
        where.stockStatus = StockStatus.GREEN_NORMAL;
      } else if (statusFilter === 'RED_MIN' || statusFilter === 'UNDER_MIN') {
        where.stockStatus = StockStatus.RED_MIN;
      } else if (statusFilter === 'RED_MAX' || statusFilter === 'OVER_MAX') {
        where.stockStatus = StockStatus.RED_MAX;
      }
    }

    // Query data items dan KPI
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, items, kpiAll, kpiNormal, kpiMin, kpiMax, txToday] = await Promise.all([
      this.prisma.partCustomerStock.count({ where }),
      this.prisma.partCustomerStock.findMany({
        where,
        include: {
          part: true,
        },
        orderBy: [
          { stockStatus: 'asc' }, // Warning RED_MIN & RED_MAX first
          { currentStock: 'asc' },
        ],
        skip,
        take: limit,
      }),
      // KPI Counters
      this.prisma.partCustomerStock.count({
        where: targetPt && targetPt !== 'ALL' && targetPt.trim() !== '' ? { customerName: { contains: targetPt, mode: 'insensitive' } } : {},
      }),
      this.prisma.partCustomerStock.count({
        where: {
          stockStatus: StockStatus.GREEN_NORMAL,
          ...(targetPt && targetPt !== 'ALL' && targetPt.trim() !== '' ? { customerName: { contains: targetPt, mode: 'insensitive' } } : {}),
        },
      }),
      this.prisma.partCustomerStock.count({
        where: {
          stockStatus: StockStatus.RED_MIN,
          ...(targetPt && targetPt !== 'ALL' && targetPt.trim() !== '' ? { customerName: { contains: targetPt, mode: 'insensitive' } } : {}),
        },
      }),
      this.prisma.partCustomerStock.count({
        where: {
          stockStatus: StockStatus.RED_MAX,
          ...(targetPt && targetPt !== 'ALL' && targetPt.trim() !== '' ? { customerName: { contains: targetPt, mode: 'insensitive' } } : {}),
        },
      }),
      this.prisma.stockTransaction.groupBy({
        by: ['transactionType'],
        where: {
          createdAt: { gte: startOfToday },
        },
        _sum: {
          qty: true,
        },
      }),
    ]);

    let totalInToday = 0;
    let totalOutToday = 0;
    for (const tx of txToday) {
      if (tx.transactionType === TransactionType.SCAN_IN || tx.transactionType === TransactionType.MANUAL_IN) {
        totalInToday += tx._sum.qty || 0;
      } else if (tx.transactionType === TransactionType.SCAN_OUT || tx.transactionType === TransactionType.MANUAL_OUT) {
        totalOutToday += tx._sum.qty || 0;
      }
    }

    const formattedData = items.map((s) => ({
      id: s.id,
      partId: s.partId,
      partNumber: s.part.partNumber,
      partName: s.part.partName,
      customerPt: s.customerName,
      customerName: s.customerName,
      customerPartNumber: s.customerPartNumber,
      minStock: s.minStock,
      maxStock: s.maxStock,
      currentStock: s.currentStock,
      stockStatus: s.stockStatus === 'RED_MIN' ? 'UNDER_MIN' : s.stockStatus === 'RED_MAX' ? 'OVER_MAX' : 'NORMAL',
      category: s.part.category,
      part: s.part,
    }));

    return {
      status: 'Berhasil',
      success: true,
      kpi: {
        totalParts: kpiAll,
        normalCount: kpiNormal,
        understockCount: kpiMin,
        overstockCount: kpiMax,
        warningTotal: kpiMin + kpiMax,
        totalInToday,
        totalOutToday,
      },
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics(customerName?: string) {
    const whereClause: any = {};
    if (customerName && customerName !== 'ALL' && customerName.trim() !== '') {
      whereClause.customerName = { contains: customerName, mode: 'insensitive' };
    }

    // 1. Tren 7 Hari Terakhir
    const last7Days: { date: string; inQty: number; outQty: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

      const txGroup = await this.prisma.stockTransaction.groupBy({
        by: ['transactionType'],
        where: {
          createdAt: { gte: d, lt: nextD },
          partCustomerStock: whereClause,
        },
        _sum: { qty: true },
      });

      let inQty = 0;
      let outQty = 0;
      for (const t of txGroup) {
        if (t.transactionType === TransactionType.SCAN_IN || t.transactionType === TransactionType.MANUAL_IN) {
          inQty += t._sum.qty || 0;
        } else {
          outQty += t._sum.qty || 0;
        }
      }

      last7Days.push({ date: dateStr, inQty, outQty });
    }

    // 2. Distribusi Status Stok
    const [totalAllocations, normalCount, minCount, maxCount, totalParts] = await Promise.all([
      this.prisma.partCustomerStock.count({ where: whereClause }),
      this.prisma.partCustomerStock.count({
        where: { stockStatus: StockStatus.GREEN_NORMAL, ...whereClause },
      }),
      this.prisma.partCustomerStock.count({
        where: { stockStatus: StockStatus.RED_MIN, ...whereClause },
      }),
      this.prisma.partCustomerStock.count({
        where: { stockStatus: StockStatus.RED_MAX, ...whereClause },
      }),
      this.prisma.masterPart.count(),
    ]);

    const statusDistribution = [
      { name: 'Normal (Ideal)', value: normalCount, color: '#10b981' },
      { name: 'Stok Menipis (<= Min)', value: minCount, color: '#ef4444' },
      { name: 'Overstock (>= Max)', value: maxCount, color: '#f59e0b' },
    ];

    return {
      status: 'Berhasil',
      success: true,
      data: {
        totalParts,
        totalAllocations,
        normalStockCount: normalCount,
        underMinCount: minCount,
        overMaxCount: maxCount,
        dailyTrends: last7Days,
        dailyTrend: last7Days,
        statusDistribution,
      },
    };
  }

  async processManualInput(dto: any, authUser?: any) {
    const partNumber = dto.partNumber;
    const customerName = dto.customerPt || dto.customerName;
    const qty = Number(dto.qty);
    const status = dto.type || dto.status || 'IN';
    const lineAsal = dto.originLineOrVendor || dto.lineAsal || 'MANUAL INPUT';
    const destinationDoorOrPt = dto.destinationDoorOrPt || customerName;
    const manualTimestamp = dto.manualTimestamp;
    const notes = dto.notes;
    const userId = dto.userId || authUser?.id || 1;

    // 1. Cari Part
    const masterPart = await this.prisma.masterPart.findFirst({
      where: {
        OR: [
          { partNumber: partNumber.trim() },
          { partNumber: { contains: partNumber.trim(), mode: 'insensitive' } },
        ],
      },
      include: { customerStocks: true },
    });

    if (!masterPart) {
      throw new NotFoundException({
        status: 'Gagal',
        success: false,
        message: `Part Number '${partNumber}' tidak ditemukan di database WHFG`,
      });
    }

    // 2. Cari / Tentukan Alokasi PT
    let ptStock = masterPart.customerStocks.find((cs) => {
      if (customerName) {
        return cs.customerName.toLowerCase().includes(customerName.toLowerCase());
      }
      return true;
    });

    if (!ptStock) {
      ptStock = masterPart.customerStocks[0];
    }

    if (!ptStock) {
      ptStock = await this.prisma.partCustomerStock.create({
        data: {
          partId: masterPart.id,
          customerName: customerName || 'PT. MENARA TERUS MAKMUR (INTERNAL)',
          minStock: 50,
          maxStock: 200,
          currentStock: 0,
          stockStatus: StockStatus.RED_MIN,
        },
      });
    }

    // 3. Validasi OUT
    if (status === 'OUT' && ptStock.currentStock < qty) {
      throw new BadRequestException({
        status: 'Gagal',
        success: false,
        message: `Stok tidak mencukupi untuk manual OUT (Stok saat ini: ${ptStock.currentStock}, Permintaan: ${qty})`,
      });
    }

    // 4. Eksekusi Transaksi Atomik
    const prevStock = ptStock.currentStock;
    const newStock = status === 'IN' ? prevStock + qty : Math.max(0, prevStock - qty);

    let newStatus: StockStatus = StockStatus.GREEN_NORMAL;
    if (newStock <= ptStock.minStock) {
      newStatus = StockStatus.RED_MIN;
    } else if (newStock >= ptStock.maxStock) {
      newStatus = StockStatus.RED_MAX;
    }

    const txDate = manualTimestamp ? new Date(manualTimestamp) : new Date();
    const uniqueTag = `MANUAL-${masterPart.partNumber}-${Date.now()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      let lot = null;
      if (status === 'IN') {
        lot = await tx.stockLot.create({
          data: {
            uniqueTag,
            partCustomerStockId: ptStock.id,
            qty,
            lineAsal: lineAsal.trim(),
            status: LotStatus.IN_STOCK,
            inTimestamp: txDate,
          },
        });
      }

      const updatedPtStock = await tx.partCustomerStock.update({
        where: { id: ptStock.id },
        data: {
          currentStock: newStock,
          stockStatus: newStatus,
          ...(status === 'IN' ? { lastInAt: txDate } : { lastOutAt: txDate }),
        },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          transactionType: status === 'IN' ? TransactionType.MANUAL_IN : TransactionType.MANUAL_OUT,
          uniqueTag,
          partCustomerStockId: ptStock.id,
          lotId: lot ? lot.id : null,
          qty,
          previousStock: prevStock,
          currentStock: newStock,
          lineAsal: lineAsal.trim(),
          userId,
          notes: notes ? `Manual Input: ${notes}` : 'Fallback Manual Input',
          createdAt: txDate,
        },
      });

      return { updatedPtStock, transaction };
    });

    return {
      status: 'Berhasil',
      success: true,
      message: `Input Manual ${status} berhasil diproses`,
      transaction: {
        id: result.transaction.id,
        type: status,
        partNumber: masterPart.partNumber,
        partName: masterPart.partName,
        customerPt: result.updatedPtStock.customerName,
        qty,
        originLineOrVendor: lineAsal,
        destinationDoorOrPt,
        createdAt: txDate.toISOString(),
      },
      currentStock: result.updatedPtStock.currentStock,
      minStock: result.updatedPtStock.minStock,
      maxStock: result.updatedPtStock.maxStock,
      stockStatus: result.updatedPtStock.stockStatus,
    };
  }
}
