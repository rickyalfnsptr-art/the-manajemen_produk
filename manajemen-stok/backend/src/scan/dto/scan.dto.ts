import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class ScanDto {
  @IsNotEmpty({ message: 'Data QR Code tidak boleh kosong' })
  @IsString()
  qrData: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  deviceSource?: string;
}
