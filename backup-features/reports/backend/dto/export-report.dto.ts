import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportType {
  MONTHLY_MUTATION = 'MONTHLY_MUTATION',
  AUDIT_LOG = 'AUDIT_LOG',
  STOCK_EVALUATION = 'STOCK_EVALUATION',
  AGING_DWELL_TIME = 'AGING_DWELL_TIME',
}

export class ExportReportDto {
  @IsEnum(ReportType)
  reportType: ReportType;

  @IsOptional()
  @IsString()
  customerPt?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';
}
