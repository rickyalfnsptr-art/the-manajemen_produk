import { PrismaClient, Role, StockStatus, LotStatus, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai pembuatan Data Dummy Lengkap untuk Testing Sistem WHFG MTM...');

  // 1. Ensure Demo Users Exist
  const defaultPasswordHash = await bcrypt.hash('mtm12345', 10);
  const users = [
    { npk: 'PPIC001', username: 'ppic_user', fullName: 'Budi Santoso (PPIC)', dept: 'PPIC', role: Role.PPIC },
    { npk: 'WH001', username: 'operator_wh', fullName: 'Joko Widodo (Operator WH)', dept: 'WAREHOUSE', role: Role.OPERATOR },
    { npk: 'LEAD01', username: 'leader_wh', fullName: 'Ahmad Dahlan (Leader WH)', dept: 'WAREHOUSE', role: Role.ADMIN },
    { npk: 'ADM001', username: 'admin_mtm', fullName: 'Administrator MTM', dept: 'IT & PPIC', role: Role.ADMIN },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { fullName: u.fullName, department: u.dept, role: u.role, password: defaultPasswordHash, isActive: true },
      create: { npk: u.npk, username: u.username, password: defaultPasswordHash, fullName: u.fullName, department: u.dept, role: u.role, isActive: true },
    });
  }

  const operator = await prisma.user.findFirst({ where: { username: 'operator_wh' } });
  const userId = operator ? operator.id : 1;

  // 2. Master Parts Definition
  const sampleParts = [
    { partNumber: '45102-BZ020', partName: 'STEERING WHEEL ASSY', category: 'Assy Component', line: 'LINE ASSY 1', location: 'PRODUCTION_1', standardQty: 25 },
    { partNumber: '45107-BZ010', partName: 'TIRE WRENCH 19MM', category: 'Tire Wrench', line: 'LINE MACHINING 1', location: 'PRODUCTION_1', standardQty: 50 },
    { partNumber: '45110-BZ030', partName: 'HUB NUT M12x1.5', category: 'Hub Nut', line: 'LINE MACHINING 2', location: 'PRODUCTION_2', standardQty: 100 },
    { partNumber: '51101-BZ040', partName: 'JACK HANDLE EXTENSION', category: 'Jack Handle', line: 'LINE STAMPING 1', location: 'PRODUCTION_1', standardQty: 40 },
    { partNumber: '62100-BZ050', partName: 'ROD HANDLE SET', category: 'Rod Handle', line: 'LINE STAMPING 2', location: 'PRODUCTION_2', standardQty: 30 },
    { partNumber: '73100-BZ060', partName: 'CONNECTING ROD FORGING', category: 'Connecting Rod', line: 'LINE FORGING 1', location: 'PRODUCTION_1', standardQty: 20 },
    { partNumber: '84100-BZ070', partName: 'FLANGE COMP DRIVESHAFT', category: 'Flange', line: 'LINE MACHINING 1', location: 'PRODUCTION_2', standardQty: 35 },
    { partNumber: '95100-BZ080', partName: 'HOUSING STEERING GEAR', category: 'Housing', line: 'LINE MACHINING 3', location: 'PRODUCTION_1', standardQty: 15 },
    { partNumber: '11200-BZ090', partName: 'LEVER PARKING BRAKE', category: 'Lever Handle', line: 'LINE ASSY 2', location: 'SUBCOUNT', standardQty: 45 },
    { partNumber: '22300-BZ100', partName: 'DRIVE PIN PISTON', category: 'Pin Piston', line: 'LINE MACHINING 2', location: 'PRODUCTION_1', standardQty: 80 },
  ];

  const customers = [
    'PT. TOYOTA MOTOR MANUFACTURING INDONESIA',
    'PT. TOYOTA ASTRA MOTOR',
    'PT. ASTRA DAIHATSU MOTOR',
    'PT. HONDA PRECISION PARTS MANUFACTURING',
    'PT. SUZUKI INDOMOBIL MOTOR',
    'PT. ISUZU ASTRA MOTOR INDONESIA',
    'PT. AISIN INDONESIA',
  ];

  console.log('📦 Membuat / Memperbarui Master Part & Alokasi Customer PT...');
  
  const createdAllocations: any[] = [];

  for (let pIdx = 0; pIdx < sampleParts.length; pIdx++) {
    const sp = sampleParts[pIdx];
    const part = await prisma.masterPart.upsert({
      where: { partNumber: sp.partNumber },
      update: {
        partName: sp.partName,
        category: sp.category,
        defaultLine: sp.line,
        location: sp.location,
        standardQty: sp.standardQty,
        isActive: true,
      },
      create: {
        partNumber: sp.partNumber,
        partName: sp.partName,
        category: sp.category,
        defaultLine: sp.line,
        location: sp.location,
        standardQty: sp.standardQty,
        isActive: true,
      },
    });

    // Alokasikan ke 2-4 Customer PT per Part dengan berbagai variasi status stok
    const assignedCustomers = [
      customers[pIdx % customers.length],
      customers[(pIdx + 1) % customers.length],
      customers[(pIdx + 3) % customers.length],
    ];

    for (let cIdx = 0; cIdx < assignedCustomers.length; cIdx++) {
      const custName = assignedCustomers[cIdx];
      
      // Tentukan status simulasi: Kritis, Overstock, atau Normal
      let minStock = 50 + (pIdx * 10);
      let maxStock = 200 + (pIdx * 30);
      let currentStock = 100;
      let stockStatus: StockStatus = StockStatus.GREEN_NORMAL;

      const variant = (pIdx + cIdx) % 3;
      if (variant === 0) {
        // KRITIS (<= Min)
        currentStock = Math.max(5, Math.floor(minStock * 0.4));
        stockStatus = StockStatus.RED_MIN;
      } else if (variant === 1) {
        // OVERSTOCK (>= Max)
        currentStock = Math.floor(maxStock * 1.3);
        stockStatus = StockStatus.RED_MAX;
      } else {
        // NORMAL
        currentStock = Math.floor((minStock + maxStock) / 2);
        stockStatus = StockStatus.GREEN_NORMAL;
      }

      const alloc = await prisma.partCustomerStock.upsert({
        where: {
          partId_customerName: {
            partId: part.id,
            customerName: custName,
          },
        },
        update: {
          minStock,
          maxStock,
          currentStock,
          stockStatus,
          customerPartNumber: `${sp.partNumber}-C${cIdx + 1}`,
        },
        create: {
          partId: part.id,
          customerName: custName,
          customerPartNumber: `${sp.partNumber}-C${cIdx + 1}`,
          minStock,
          maxStock,
          currentStock,
          stockStatus,
        },
      });

      createdAllocations.push({ alloc, part });
    }
  }

  console.log(`✅ Berhasil membuat ${createdAllocations.length} Alokasi Part & Customer PT!`);

  // 3. Buat Data Lot Aktif dengan Dwell Time / Aging Beragam (Fresh, Normal, Warning, Critical)
  console.log('🏷️ Membuat Data Stock Lot Aktif dengan Variasi Aging...');
  const now = new Date();
  let totalLots = 0;

  for (let aIdx = 0; aIdx < createdAllocations.length; aIdx++) {
    const { alloc, part } = createdAllocations[aIdx];
    const lotCount = 2 + (aIdx % 3);

    for (let l = 0; l < lotCount; l++) {
      // Jam masuk bervariasi: 5 jam lalu (Fresh), 30 jam lalu (Normal), 55 jam lalu (Warning), 85 jam lalu (Critical)
      const hoursAgo = (l === 0) ? (4 + aIdx) : (l === 1) ? (28 + aIdx) : (l === 2) ? (52 + aIdx) : (80 + aIdx);
      const inTime = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      const tag = `LOT-${part.partNumber}-${aIdx}-${l}-${Math.floor(Math.random() * 1000)}`;
      const lotQty = Math.floor(alloc.currentStock / lotCount) || part.standardQty || 20;

      await prisma.stockLot.upsert({
        where: { uniqueTag: tag },
        update: {
          qty: lotQty,
          status: LotStatus.IN_STOCK,
          inTimestamp: inTime,
        },
        create: {
          uniqueTag: tag,
          partCustomerStockId: alloc.id,
          qty: lotQty,
          lineAsal: part.defaultLine || 'LINE MACHINING 1',
          status: LotStatus.IN_STOCK,
          inTimestamp: inTime,
        },
      });
      totalLots++;
    }
  }

  console.log(`✅ Berhasil membuat ${totalLots} Stock Lot Aktif!`);

  // 4. Buat Riwayat Transaksi Mutasi 7 Hari Terakhir (SCAN_IN & SCAN_OUT)
  console.log('📊 Membuat Riwayat Transaksi 7 Hari Terakhir untuk Chart & Journey Tracking...');
  
  const doors = ['PINTU-1', 'PINTU-2', 'PINTU-3', 'DOCK-DELIVERY-1', 'DOCK-DELIVERY-2'];
  let totalTx = 0;

  for (let day = 6; day >= 0; day--) {
    const txDate = new Date(now);
    txDate.setDate(now.getDate() - day);
    txDate.setHours(8 + (day % 4), 15, 0, 0);

    const outDate = new Date(txDate);
    outDate.setHours(14 + (day % 3), 30, 0, 0);

    for (let aIdx = 0; aIdx < Math.min(createdAllocations.length, 12); aIdx++) {
      const { alloc, part } = createdAllocations[aIdx];
      const inQty = (part.standardQty || 25) * (1 + (aIdx % 3));
      const outQty = Math.floor(inQty * 0.75);
      const doorIn = doors[aIdx % doors.length];
      const doorOut = doors[(aIdx + 2) % doors.length];
      const tagIn = `LOT-HIST-${part.partNumber}-D${day}-A${aIdx}`;

      // Transaksi SCAN IN
      await prisma.stockTransaction.create({
        data: {
          transactionType: TransactionType.SCAN_IN,
          partCustomerStockId: alloc.id,
          qty: inQty,
          previousStock: alloc.currentStock,
          currentStock: alloc.currentStock + inQty,
          lineAsal: part.defaultLine || 'LINE MACHINING 1',
          userId: userId,
          createdAt: txDate,
          uniqueTag: tagIn,
          qrRawData: `PART:${part.partNumber}|PT:${alloc.customerName}|QTY:${inQty}|LOT:${tagIn}`,
          notes: `Scan In dari ${part.defaultLine || 'Line Produksi'} via ${doorIn}`,
        },
      });
      totalTx++;

      // Transaksi SCAN OUT
      if (outQty > 0) {
        await prisma.stockTransaction.create({
          data: {
            transactionType: TransactionType.SCAN_OUT,
            partCustomerStockId: alloc.id,
            qty: outQty,
            previousStock: alloc.currentStock + inQty,
            currentStock: alloc.currentStock + inQty - outQty,
            lineAsal: part.defaultLine || 'LINE MACHINING 1',
            userId: userId,
            createdAt: outDate,
            uniqueTag: tagIn,
            qrRawData: `PART:${part.partNumber}|PT:${alloc.customerName}|QTY:${outQty}|OUT`,
            notes: `Delivery pengiriman ke ${alloc.customerName} via ${doorOut}`,
          },
        });
        totalTx++;
      }
    }
  }

  console.log(`✅ Berhasil membuat ${totalTx} Riwayat Transaksi Mutasi 7 Hari Terakhir!`);
  console.log('🎉 Selesai! Semua data dummy testing telah aktif di database.');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding data dummy:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
