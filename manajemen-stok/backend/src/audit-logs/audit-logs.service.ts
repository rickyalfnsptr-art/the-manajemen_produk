import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    transactionType?: string;
    customerName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, transactionType, customerName, startDate, endDate, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (transactionType && transactionType !== 'ALL') {
      where.transactionType = transactionType;
    }

    if (customerName && customerName !== 'ALL') {
      where.partCustomerStock = {
        customerName: { contains: customerName, mode: 'insensitive' },
      };
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { uniqueTag: { contains: q, mode: 'insensitive' } },
        { lineAsal: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { npk: { contains: q, mode: 'insensitive' } } },
        { partCustomerStock: { part: { partNumber: { contains: q, mode: 'insensitive' } } } },
        { partCustomerStock: { part: { partName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, transactions] = await Promise.all([
      this.prisma.stockTransaction.count({ where }),
      this.prisma.stockTransaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, npk: true, username: true, fullName: true, department: true },
          },
          partCustomerStock: {
            include: { part: true },
          },
          lot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      status: 'Berhasil',
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
