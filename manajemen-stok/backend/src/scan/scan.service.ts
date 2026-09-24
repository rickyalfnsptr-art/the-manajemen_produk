import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanDto } from './dto/scan.dto';
import { parseQrData } from '../common/utils/qr-parser.util';
import { formatDuration } from '../common/utils/date.util';
import { StockStatus, LotStatus, TransactionType } from '@prisma/client';

@Injectable()
export class ScanService {
  constructor(private readonly prisma: PrismaService) {}

  async processScanIn(dto: ScanDto, authUser?: any) {
    const { qrData, customerName, deviceSource } = dto;
    const parsed = parseQrData(qrData);

    if (!parsed.partNumber) {
      throw new BadRequestException({
        status: 'Gagal',
        message: 'Format QR Code tidak valid: Part Number tidak ditemukan',
      });
    }

    // 1. Cari Part Master
    let masterPart = await this.prisma.masterPart.findFirst({
      where: {
        OR: [
          { partNumber: parsed.partNumber },
          { partNumber: { contains: parsed.partNumber, mode: 'insensitive' } },
        ],
      },
      include: {
        customerStocks: true,
      },
    });

    if (!masterPart && parsed.customerPartNumber) {
      masterPart = await this.prisma.masterPart.findFirst({
        where: {
          customerStocks: {
            some: {
              customerPartNumber: { contains: parsed.customerPartNumber, mode: 'insensitive' },
            },
          },
        },
        include: {
          customerStocks: true,
        },
      });
    }

    if (!masterPart) {
      throw new NotFoundException({
        status: 'Gagal',
        message: `Part Number '${parsed.partNumber}' tidak terdaftar dalam Master Data`,
      });
    }

    // 2. Tentukan alokasi PT Customer
    let ptStock = masterPart.customerStocks.find((cs) => {
      if (customerName) {
        return cs.customerName.toLowerCase().includes(customerName.toLowerCase());
      }
      if (parsed.customerPartNumber && cs.customerPartNumber) {
        return cs.customerPartNumber.toLowerCase() === parsed.customerPartNumber.toLowerCase();
      }
      return true;
    });

    if (!ptStock) {
      // Buat default jika belum ada
      ptStock = await this.prisma.partCustomerStock.create({
        data: {
          partId: masterPart.id,
          customerName: customerName || 'PT. MENARA TERUS MAKMUR (INTERNAL)',
          customerPartNumber: parsed.customerPartNumber || null,
          minStock: 50,
          maxStock: 200,
          currentStock: 0,
          stockStatus: StockStatus.RED_MIN,
        },
      });
    }

    const qty = parsed.qty > 0 ? parsed.qty : (masterPart.standardQty > 0 ? masterPart.standardQty : 1);
    const lineAsal = parsed.lineOrJob || masterPart.defaultLine || 'LINE PRODUKSI';
    const userId = dto.userId || authUser?.id || 1;

    // 3. Validasi Anti-Duplikasi
    const existingLot = await this.prisma.stockLot.findUnique({
      where: { uniqueTag: parsed.uniqueTag },
    });

    if (existingLot && existingLot.status === LotStatus.IN_STOCK) {
      throw new BadRequestException({
        status: 'Gagal',
        message: 'Gagal karena sudah discan',
        detail: `QR Code dengan tag '${parsed.uniqueTag}' sudah berada dalam status IN_STOCK`,
      });
    }

    // 4. Eksekusi Database Transaction Atomik (Isolasi Transaksi)
    const result = await this.prisma.$transaction(async (tx) => {
      // Buat/Update Lot
      const lot = await tx.stockLot.upsert({
        where: { uniqueTag: parsed.uniqueTag },
        update: {
          partCustomerStockId: ptStock.id,
          qty,
          lineAsal,
          status: LotStatus.IN_STOCK,
          inTimestamp: new Date(),
          outTimestamp: null,
          durationMinutes: null,
        },
        create: {
          uniqueTag: parsed.uniqueTag,
          partCustomerStockId: ptStock.id,
          qty,
          lineAsal,
          status: LotStatus.IN_STOCK,
          inTimestamp: new Date(),
        },
      });

      const prevStock = ptStock.currentStock;
      const newStock = prevStock + qty;

      // Evaluasi status warna (Merah <= Min, Merah >= Max, Hijau normal)
      let newStatus: StockStatus = StockStatus.GREEN_NORMAL;
      if (newStock <= ptStock.minStock) {
        newStatus = StockStatus.RED_MIN;
      } else if (newStock >= ptStock.maxStock) {
        newStatus = StockStatus.RED_MAX; // Non-blocking: barang tetap masuk, hanya memicu warning merah
      }

      // Update PartCustomerStock
      const updatedPtStock = await tx.partCustomerStock.update({
        where: { id: ptStock.id },
        data: {
          currentStock: newStock,
          stockStatus: newStatus,
          lastInAt: new Date(),
        },
      });

      // Insert Audit Transaction
      const transaction = await tx.stockTransaction.create({
        data: {
          transactionType: TransactionType.SCAN_IN,
          qrRawData: parsed.raw,
          uniqueTag: parsed.uniqueTag,
          partCustomerStockId: ptStock.id,
          lotId: lot.id,
          qty,
          previousStock: prevStock,
          currentStock: newStock,
          lineAsal,
          userId,
          notes: deviceSource ? `Device: ${deviceSource}` : 'Scan IN Zebra',
        },
      });

      return {
        lot,
        updatedPtStock,
        transaction,
      };
    });

    return {
      status: 'Berhasil',
      message: 'Scan IN berhasil diproses',
      data: {
        partNumber: masterPart.partNumber,
        partName: masterPart.partName,
        customerName: result.updatedPtStock.customerName,
        qty,
        lineAsal,
        previousStock: result.transaction.previousStock,
        currentStock: result.updatedPtStock.currentStock,
        minStock: result.updatedPtStock.minStock,
        maxStock: result.updatedPtStock.maxStock,
        stockStatus: result.updatedPtStock.stockStatus,
        uniqueTag: parsed.uniqueTag,
        inTimestamp: result.lot.inTimestamp,
      },
    };
  }

  async processScanOut(dto: ScanDto, authUser?: any) {
    const { qrData, customerName, deviceSource } = dto;
    const parsed = parseQrData(qrData);

    if (!parsed.partNumber) {
      throw new BadRequestException({
        status: 'Gagal',
        message: 'Format QR Code tidak valid: Part Number tidak ditemukan',
      });
    }

    // 1. Cari Part Master
    let masterPart = await this.prisma.masterPart.findFirst({
      where: {
        OR: [
          { partNumber: parsed.partNumber },
          { partNumber: { contains: parsed.partNumber, mode: 'insensitive' } },
        ],
      },
      include: {
        customerStocks: true,
      },
    });

    if (!masterPart && parsed.customerPartNumber) {
      masterPart = await this.prisma.masterPart.findFirst({
        where: {
          customerStocks: {
            some: {
              customerPartNumber: { contains: parsed.customerPartNumber, mode: 'insensitive' },
            },
          },
        },
        include: {
          customerStocks: true,
        },
      });
    }

    if (!masterPart) {
      throw new NotFoundException({
        status: 'Gagal',
        message: `Part Number '${parsed.partNumber}' tidak terdaftar dalam Master Data`,
      });
    }

    // 2. Cari Alokasi PT
    let ptStock = masterPart.customerStocks.find((cs) => {
      if (customerName) {
        return cs.customerName.toLowerCase().includes(customerName.toLowerCase());
      }
      return true;
    });

    if (!ptStock) {
      ptStock = masterPart.customerStocks[0];
    }

    const qty = parsed.qty > 0 ? parsed.qty : (masterPart.standardQty > 0 ? masterPart.standardQty : 1);
    const userId = dto.userId || authUser?.id || 1;

    // 3. Validasi Stok Tersedia
    if (!ptStock || ptStock.currentStock < qty) {
      throw new BadRequestException({
        status: 'Gagal',
        message: 'Stok tidak mencukupi untuk dikeluarkan',
        detail: `Stok saat ini: ${ptStock ? ptStock.currentStock : 0}, Permintaan keluar: ${qty}`,
      });
    }

    // 4. Validasi Lot & Anti-Duplikasi Scan OUT
    const lot = await this.prisma.stockLot.findUnique({
      where: { uniqueTag: parsed.uniqueTag },
    });

    if (!lot || lot.status === LotStatus.OUT_STOCK) {
      throw new BadRequestException({
        status: 'Gagal',
        message: 'Gagal karena sudah discan',
        detail: `Kanban dengan tag '${parsed.uniqueTag}' sudah berstatus OUT_STOCK atau tidak tercatat di gudang`,
      });
    }

    // 5. Eksekusi Database Transaction Atomik
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - new Date(lot.inTimestamp).getTime()) / (1000 * 60));
    const durationText = formatDuration(lot.inTimestamp, now);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update Lot
      const updatedLot = await tx.stockLot.update({
        where: { id: lot.id },
        data: {
          status: LotStatus.OUT_STOCK,
          outTimestamp: now,
          durationMinutes,
        },
      });

      const prevStock = ptStock.currentStock;
      const newStock = Math.max(0, prevStock - qty);

      // Evaluasi status warna
      let newStatus: StockStatus = StockStatus.GREEN_NORMAL;
      if (newStock <= ptStock.minStock) {
        newStatus = StockStatus.RED_MIN;
      } else if (newStock >= ptStock.maxStock) {
        newStatus = StockStatus.RED_MAX;
      }

      const updatedPtStock = await tx.partCustomerStock.update({
        where: { id: ptStock.id },
        data: {
          currentStock: newStock,
          stockStatus: newStatus,
          lastOutAt: now,
        },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          transactionType: TransactionType.SCAN_OUT,
          qrRawData: parsed.raw,
          uniqueTag: parsed.uniqueTag,
          partCustomerStockId: ptStock.id,
          lotId: lot.id,
          qty,
          previousStock: prevStock,
          currentStock: newStock,
          lineAsal: lot.lineAsal,
          userId,
          notes: deviceSource ? `Device: ${deviceSource}` : 'Scan OUT Zebra',
        },
      });

      return {
        lot: updatedLot,
        updatedPtStock,
        transaction,
      };
    });

    return {
      status: 'Berhasil',
      message: 'Scan OUT berhasil diproses',
      data: {
        partNumber: masterPart.partNumber,
        partName: masterPart.partName,
        customerName: result.updatedPtStock.customerName,
        qty,
        previousStock: result.transaction.previousStock,
        currentStock: result.updatedPtStock.currentStock,
        minStock: result.updatedPtStock.minStock,
        maxStock: result.updatedPtStock.maxStock,
        stockStatus: result.updatedPtStock.stockStatus,
        uniqueTag: parsed.uniqueTag,
        inTimestamp: result.lot.inTimestamp,
        outTimestamp: result.lot.outTimestamp,
        dwellTime: durationText,
      },
    };
  }
}
