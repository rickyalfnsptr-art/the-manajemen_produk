import { PrismaClient, TransactionType, LotStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menambahkan data dummy mutasi 7 hari terakhir untuk testing...');

  const operatorUser = await prisma.user.findFirst({
    where: { username: 'operator_wh' },
  });
  const userId = operatorUser ? operatorUser.id : 1;

  // Ambil beberapa alokasi part customer
  const allocations = await prisma.partCustomerStock.findMany({
    take: 8,
    include: { part: true },
  });

  if (allocations.length === 0) {
    console.log('⚠️ Belum ada data PartCustomerStock. Silakan jalankan seed master part terlebih dahulu.');
    return;
  }

  const today = new Date();

  // Pola data mutasi 7 hari (IN vs OUT)
  const pattern = [
    { dayOffset: 6, inTotal: 180, outTotal: 120, line: 'LINE MACHINING 1' },
    { dayOffset: 5, inTotal: 260, outTotal: 210, line: 'LINE MACHINING 2' },
    { dayOffset: 4, inTotal: 340, outTotal: 290, line: 'LINE STAMPING 1' },
    { dayOffset: 3, inTotal: 190, outTotal: 250, line: 'LINE ASSY 1' },
    { dayOffset: 2, inTotal: 420, outTotal: 360, line: 'LINE MACHINING 1' },
    { dayOffset: 1, inTotal: 380, outTotal: 310, line: 'LINE STAMPING 2' },
    { dayOffset: 0, inTotal: 310, outTotal: 190, line: 'LINE MACHINING 1' },
  ];

  let createdCount = 0;

  for (const p of pattern) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - p.dayOffset);
    targetDate.setHours(9, 30, 0, 0);

    const outDate = new Date(targetDate);
    outDate.setHours(14, 15, 0, 0);

    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i];
      const partInQty = Math.round(p.inTotal / allocations.length) + (i % 3) * 10;
      const partOutQty = Math.round(p.outTotal / allocations.length) + (i % 2) * 5;

      const tag = `LOT-TEST-${alloc.part.partNumber}-${p.dayOffset}-${i}-${Date.now()}`;
      
      // 1. Create StockLot
      const lot = await prisma.stockLot.create({
        data: {
          uniqueTag: tag,
          partCustomerStockId: alloc.id,
          qty: partInQty,
          lineAsal: alloc.part.defaultLine || p.line,
          status: LotStatus.IN_STOCK,
          inTimestamp: targetDate,
        },
      });

      // 2. Transaction IN
      await prisma.stockTransaction.create({
        data: {
          transactionType: TransactionType.SCAN_IN,
          partCustomerStockId: alloc.id,
          lotId: lot.id,
          qty: partInQty,
          previousStock: alloc.currentStock,
          currentStock: alloc.currentStock + partInQty,
          lineAsal: alloc.part.defaultLine || p.line,
          userId: userId,
          createdAt: targetDate,
          qrRawData: `PART:${alloc.part.partNumber}|PT:${alloc.customerName}|QTY:${partInQty}|LOT:${tag}`,
          uniqueTag: tag,
        },
      });
      createdCount++;

      // 3. Transaction OUT
      if (partOutQty > 0) {
        await prisma.stockTransaction.create({
          data: {
            transactionType: TransactionType.SCAN_OUT,
            partCustomerStockId: alloc.id,
            lotId: lot.id,
            qty: partOutQty,
            previousStock: alloc.currentStock + partInQty,
            currentStock: alloc.currentStock + partInQty - partOutQty,
            lineAsal: alloc.part.defaultLine || p.line,
            userId: userId,
            createdAt: outDate,
            qrRawData: `PART:${alloc.part.partNumber}|PT:${alloc.customerName}|QTY:${partOutQty}|OUT`,
            uniqueTag: tag,
            notes: `Delivery ke ${alloc.customerName}`,
          },
        });
        createdCount++;
      }
    }
  }

  console.log(`✅ Berhasil membuat ${createdCount} transaksi dummy untuk 7 hari terakhir!`);
}

main()
  .catch((e) => {
    console.error('❌ Error saat menambahkan dummy transactions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
