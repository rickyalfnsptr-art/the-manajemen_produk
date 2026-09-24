import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { StockStatus } from '@prisma/client';

@Injectable()
export class MasterPartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    category?: string;
    customerName?: string;
    line?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, category, customerName, line, location, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      const q = search.trim();
      where.OR = [
        { partNumber: { contains: q, mode: 'insensitive' } },
        { partName: { contains: q, mode: 'insensitive' } },
        {
          customerStocks: {
            some: {
              OR: [
                { customerPartNumber: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (line && line !== 'ALL') {
      where.defaultLine = line;
    }

    if (location && location !== 'ALL') {
      where.location = location;
    }

    if (customerName && customerName !== 'ALL') {
      where.customerStocks = {
        some: {
          customerName: { contains: customerName, mode: 'insensitive' },
        },
      };
    }

    const [total, parts] = await Promise.all([
      this.prisma.masterPart.count({ where }),
      this.prisma.masterPart.findMany({
        where,
        include: {
          customerStocks: {
            orderBy: { customerName: 'asc' },
          },
        },
        orderBy: { partNumber: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 'Berhasil',
      data: parts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMetadata() {
    const [categoriesRaw, linesRaw, locationsRaw, customerRaw] = await Promise.all([
      this.prisma.masterPart.findMany({
        where: { isActive: true, category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
      this.prisma.masterPart.findMany({
        where: { isActive: true, defaultLine: { not: null } },
        select: { defaultLine: true },
        distinct: ['defaultLine'],
      }),
      this.prisma.masterPart.findMany({
        where: { isActive: true, location: { not: null } },
        select: { location: true },
        distinct: ['location'],
      }),
      this.prisma.partCustomerStock.findMany({
        select: { customerName: true },
        distinct: ['customerName'],
        orderBy: { customerName: 'asc' },
      }),
    ]);

    return {
      status: 'Berhasil',
      data: {
        categories: categoriesRaw.map((c) => c.category).filter(Boolean).sort(),
        lines: linesRaw.map((l) => l.defaultLine).filter(Boolean).sort(),
        locations: locationsRaw.map((loc) => loc.location).filter(Boolean).sort(),
        customerPts: customerRaw.map((c) => c.customerName).filter(Boolean),
      },
    };
  }

  async findOne(id: number) {
    const part = await this.prisma.masterPart.findUnique({
      where: { id },
      include: {
        customerStocks: {
          include: {
            lots: {
              where: { status: 'IN_STOCK' },
              orderBy: { inTimestamp: 'desc' },
            },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundException(`Part dengan ID ${id} tidak ditemukan`);
    }

    return {
      status: 'Berhasil',
      data: part,
    };
  }

  async updatePtThreshold(partCustomerStockId: number, dto: UpdateThresholdDto) {
    const { minStock, maxStock } = dto;

    if (minStock >= maxStock) {
      throw new BadRequestException('Batas Min Stock harus lebih kecil dari Max Stock');
    }

    const existing = await this.prisma.partCustomerStock.findUnique({
      where: { id: partCustomerStockId },
      include: { part: true },
    });

    if (!existing) {
      throw new NotFoundException(`Alokasi stok PT dengan ID ${partCustomerStockId} tidak ditemukan`);
    }

    // Hitung ulang status warna
    let newStatus: StockStatus = StockStatus.GREEN_NORMAL;
    if (existing.currentStock <= minStock) {
      newStatus = StockStatus.RED_MIN;
    } else if (existing.currentStock >= maxStock) {
      newStatus = StockStatus.RED_MAX;
    }

    const updated = await this.prisma.partCustomerStock.update({
      where: { id: partCustomerStockId },
      data: {
        minStock,
        maxStock,
        stockStatus: newStatus,
      },
      include: {
        part: true,
      },
    });

    return {
      status: 'Berhasil',
      message: `Batas Min (${minStock}) dan Max (${maxStock}) untuk ${updated.part.partNumber} pada ${updated.customerName} berhasil disimpan`,
      data: updated,
    };
  }

  async createOrAssignAllocation(dto: {
    partNumber: string;
    partName: string;
    category?: string;
    customerName: string;
    customerPartNumber?: string;
    minStock: number;
    maxStock: number;
  }) {
    const { partNumber, partName, category, customerName, customerPartNumber, minStock, maxStock } = dto;

    if (minStock >= maxStock) {
      throw new BadRequestException('Batas Min Stock harus lebih kecil dari Max Stock');
    }

    // 1. Find or create MasterPart
    let part = await this.prisma.masterPart.findUnique({
      where: { partNumber: partNumber.trim() },
    });

    if (!part) {
      part = await this.prisma.masterPart.create({
        data: {
          partNumber: partNumber.trim(),
          partName: partName.trim(),
          category: category?.trim() || 'General',
        },
      });
    }

    // 2. Find or create/update PartCustomerStock
    const existingAllocation = await this.prisma.partCustomerStock.findUnique({
      where: {
        partId_customerName: {
          partId: part.id,
          customerName: customerName.trim(),
        },
      },
    });

    let allocation;
    let newStatus: StockStatus = StockStatus.GREEN_NORMAL;
    const currentStock = existingAllocation ? existingAllocation.currentStock : 0;

    if (currentStock <= minStock) {
      newStatus = StockStatus.RED_MIN;
    } else if (currentStock >= maxStock) {
      newStatus = StockStatus.RED_MAX;
    }

    if (existingAllocation) {
      allocation = await this.prisma.partCustomerStock.update({
        where: { id: existingAllocation.id },
        data: {
          customerPartNumber: customerPartNumber?.trim() || existingAllocation.customerPartNumber,
          minStock,
          maxStock,
          stockStatus: newStatus,
        },
        include: { part: true },
      });
    } else {
      allocation = await this.prisma.partCustomerStock.create({
        data: {
          partId: part.id,
          customerName: customerName.trim(),
          customerPartNumber: customerPartNumber?.trim(),
          minStock,
          maxStock,
          currentStock: 0,
          stockStatus: newStatus,
        },
        include: { part: true },
      });
    }

    return {
      status: 'Berhasil',
      message: `Alokasi Part ${part.partNumber} untuk ${customerName} dengan Min: ${minStock} & Max: ${maxStock} berhasil disimpan`,
      data: allocation,
    };
  }
}
