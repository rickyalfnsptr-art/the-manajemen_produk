import { PrismaClient, Role, StockStatus, LotStatus, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

function getPartCategory(partName: string, partNumber: string): string {
  const upperName = (partName || '').toUpperCase();
  const upperNo = (partNumber || '').toUpperCase();

  if (upperName.includes('TIRE WRENCH') || upperNo.includes('TW')) return 'Tire Wrench';
  if (upperName.includes('HUB NUT') || upperNo.includes('HN')) return 'Hub Nut';
  if (upperName.includes('JACK HANDLE') || upperNo.includes('JH')) return 'Jack Handle';
  if (upperName.includes('ROD HANDLE') || upperNo.includes('RH')) return 'Rod Handle';
  if (upperName.includes('LEVER') || upperNo.includes('LVK')) return 'Lever Handle';
  if (upperName.includes('FLANGE') || upperNo.includes('FLG')) return 'Flange';
  if (upperName.includes('HOUSING') || upperNo.includes('HOU')) return 'Housing';
  if (upperName.includes('CONROD') || upperName.includes('CONNECTING') || upperNo.includes('CON')) return 'Connecting Rod';
  if (upperName.includes('DIE ROLL') || upperNo.includes('DIEROL')) return 'Die Rolling & Tools';
  if (upperName.includes('PIN PISTON') || upperNo.includes('PIN')) return 'Pin Piston';
  if (upperName.includes('BALL RACE') || upperNo.includes('RACE')) return 'Ball Race';
  if (upperName.includes('ASSY') || upperNo.includes('ASY')) return 'Assy Component';
  if (upperName.includes('FORK') || upperName.includes('YOKE') || upperNo.includes('YOK')) return 'Fork & Yoke';
  if (upperName.includes('SHAFT') || upperNo.includes('SHF')) return 'Shaft';

  return 'General Finished Goods';
}

async function main() {
  console.log('🚀 Memulai Seeding Data Sistem Manajemen Stok WHFG PT MTM...');

  const rootDir = path.resolve(__dirname, '../../..');
  const excelPath = path.join(rootDir, 'DATA MASTER PARTS MTM (2026-09-23).xlsx');
  const csvPath = path.join(rootDir, 'users-export.csv');

  const defaultPasswordHash = await bcrypt.hash('mtm12345', 10);

  // ==========================================
  // 1. SEED DEDICATED DEMO ACCOUNTS
  // ==========================================
  const demoUsers = [
    { npk: 'PPIC001', username: 'ppic_user', fullName: 'Budi Santoso (PPIC)', dept: 'PPIC', role: Role.PPIC },
    { npk: 'WH001', username: 'operator_wh', fullName: 'Joko Widodo (Operator WH)', dept: 'WAREHOUSE', role: Role.OPERATOR },
    { npk: 'LEAD01', username: 'leader_wh', fullName: 'Ahmad Dahlan (Leader WH)', dept: 'WAREHOUSE', role: Role.ADMIN },
    { npk: 'ADM001', username: 'admin_mtm', fullName: 'Administrator MTM', dept: 'IT & PPIC', role: Role.ADMIN },
  ];

  for (const du of demoUsers) {
    await prisma.user.upsert({
      where: { username: du.username },
      update: {
        fullName: du.fullName,
        department: du.dept,
        role: du.role,
        password: defaultPasswordHash,
        isActive: true,
      },
      create: {
        npk: du.npk,
        username: du.username,
        password: defaultPasswordHash,
        fullName: du.fullName,
        department: du.dept,
        role: du.role,
        isActive: true,
      },
    });
  }
  console.log('✅ Berhasil seed 4 demo accounts (ppic_user, operator_wh, leader_wh, admin_mtm)!');

  // ==========================================
  // 2. SEED USERS DARI CSV (523 Users)
  // ==========================================
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let userCount = 0;
    for (const record of records) {
      const fullName = record['Full Name'] || record['FullName'] || 'User MTM';
      const username = record['Username'] || record['username'] || record['NPK'];
      const npk = record['NPK'] || record['npk'] || username;
      const dept = (record['Role'] || record['Department'] || '').toUpperCase();

      let role: Role = Role.OPERATOR;
      if (dept.includes('PPIC')) {
        role = Role.PPIC;
      } else if (dept.includes('ADMIN')) {
        role = Role.ADMIN;
      } else {
        role = Role.OPERATOR;
      }

      await prisma.user.upsert({
        where: { npk: npk.trim() },
        update: {
          fullName: fullName.trim(),
          username: username.trim(),
          department: dept || 'PRODUCTION',
          role,
          isActive: true,
        },
        create: {
          npk: npk.trim(),
          username: username.trim(),
          password: defaultPasswordHash,
          fullName: fullName.trim(),
          department: dept || 'PRODUCTION',
          role,
          isActive: true,
        },
      });
      userCount++;
    }
    console.log(`✅ Berhasil seed ${userCount} users dari CSV!`);
  }

  // ==========================================
  // 3. SEED MASTER PARTS DARI EXCEL
  // ==========================================
  if (fs.existsSync(excelPath)) {
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawParts: any[] = xlsx.utils.sheet_to_json(sheet);

    let partCount = 0;
    let customerStockCount = 0;

    for (const row of rawParts) {
      const partNumber = (row['Part Number'] || row['partNumber'] || '').toString().trim();
      if (!partNumber) continue;

      const partName = (row['Part Name'] || row['partName'] || partNumber).toString().trim();
      const customerNumber = (row['Customer Number'] || row['customerNumber'] || '').toString().trim();
      const standardQty = parseInt((row['Standard Qty'] || row['standardQty'] || '0').toString(), 10) || 0;
      const defaultLine = (row['Line'] || row['line'] || '').toString().trim();
      const location = (row['Location'] || row['location'] || '').toString().trim();
      const affiliatedCustomers = (row['Affiliated Customers'] || row['affiliatedCustomers'] || '').toString().trim();
      const category = getPartCategory(partName, partNumber);

      const masterPart = await prisma.masterPart.upsert({
        where: { partNumber },
        update: {
          partName,
          standardQty,
          defaultLine: defaultLine || null,
          location: location || null,
          category,
          isActive: true,
        },
        create: {
          partNumber,
          partName,
          standardQty,
          defaultLine: defaultLine || null,
          location: location || null,
          category,
          isActive: true,
        },
      });
      partCount++;

      let ptList: string[] = [];
      if (affiliatedCustomers) {
        ptList = affiliatedCustomers.split(',').map((pt: string) => pt.trim()).filter((pt: string) => pt.length > 0);
      }
      if (ptList.length === 0) {
        ptList = ['PT. MENARA TERUS MAKMUR (INTERNAL)'];
      }

      for (const ptName of ptList) {
        const minStock = standardQty > 0 ? standardQty * 2 : 50;
        const maxStock = standardQty > 0 ? standardQty * 8 : 200;

        await prisma.partCustomerStock.upsert({
          where: {
            partId_customerName: {
              partId: masterPart.id,
              customerName: ptName,
            },
          },
          update: {
            customerPartNumber: customerNumber || null,
            minStock,
            maxStock,
          },
          create: {
            partId: masterPart.id,
            customerName: ptName,
            customerPartNumber: customerNumber || null,
            minStock,
            maxStock,
            currentStock: 0,
            stockStatus: StockStatus.RED_MIN,
          },
        });
        customerStockCount++;
      }
    }
    console.log(`✅ Berhasil seed ${partCount} Master Parts dan ${customerStockCount} Part-Customer Alokasi!`);
  }

  // Also guarantee sample automotive parts
  const sampleAutomotiveParts = [
    {
      partNumber: '45107-BZ010',
      partName: 'COLLAR STEERING COLUMN',
      category: 'Machining',
      standardQty: 50,
      defaultLine: 'LINE MACHINING 1',
      pts: [
        { name: 'PT. TOYOTA MOTOR MANUFACTURING INDONESIA', min: 100, max: 500, stock: 150 },
        { name: 'PT. TOYOTA ASTRA MOTOR', min: 50, max: 200, stock: 80 },
      ],
    },
    {
      partNumber: '45102-BZ020',
      partName: 'BRACKET PEDAL BRAKE',
      category: 'Stamping',
      standardQty: 100,
      defaultLine: 'LINE STAMPING 2',
      pts: [
        { name: 'PT. ASTRA DAIHATSU MOTOR', min: 150, max: 600, stock: 650 }, // Overstock sample
      ],
    },
    {
      partNumber: '45110-BZ030',
      partName: 'SHAFT LOWER INTERMEDIATE',
      category: 'Assembly',
      standardQty: 25,
      defaultLine: 'LINE ASSY 1',
      pts: [
        { name: 'PT. SUZUKI INDOMOBIL MOTOR', min: 80, max: 400, stock: 40 }, // Critical min sample
      ],
    },
  ];

  for (const sp of sampleAutomotiveParts) {
    const mp = await prisma.masterPart.upsert({
      where: { partNumber: sp.partNumber },
      update: {
        partName: sp.partName,
        category: sp.category,
        standardQty: sp.standardQty,
        defaultLine: sp.defaultLine,
      },
      create: {
        partNumber: sp.partNumber,
        partName: sp.partName,
        category: sp.category,
        standardQty: sp.standardQty,
        defaultLine: sp.defaultLine,
      },
    });

    for (const pt of sp.pts) {
      let status: StockStatus = StockStatus.GREEN_NORMAL;
      if (pt.stock <= pt.min) status = StockStatus.RED_MIN;
      else if (pt.stock >= pt.max) status = StockStatus.RED_MAX;

      await prisma.partCustomerStock.upsert({
        where: {
          partId_customerName: {
            partId: mp.id,
            customerName: pt.name,
          },
        },
        update: {
          minStock: pt.min,
          maxStock: pt.max,
          currentStock: pt.stock,
          stockStatus: status,
        },
        create: {
          partId: mp.id,
          customerName: pt.name,
          minStock: pt.min,
          maxStock: pt.max,
          currentStock: pt.stock,
          stockStatus: status,
        },
      });
    }
  }

  console.log('🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
