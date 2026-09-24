import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MasterPartsModule } from './master-parts/master-parts.module';
import { ScanModule } from './scan/scan.module';
import { StockModule } from './stock/stock.module';
import { TrackingModule } from './tracking/tracking.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    MasterPartsModule,
    ScanModule,
    StockModule,
    TrackingModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
