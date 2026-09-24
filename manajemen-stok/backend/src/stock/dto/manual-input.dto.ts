import { IsNotEmpty, IsString, IsNumber, Min, IsIn, IsOptional } from 'class-validator';

export class ManualInputDto {
  @IsNotEmpty({ message: 'Part Number wajib diisi' })
  @IsString()
  partNumber: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsNotEmpty({ message: 'Qty wajib diisi' })
  @IsNumber()
  @Min(1, { message: 'Qty minimal 1' })
  qty: number;

  @IsNotEmpty({ message: 'Status wajib dipilih (IN atau OUT)' })
  @IsIn(['IN', 'OUT'], { message: 'Status harus bernilai IN atau OUT' })
  status: 'IN' | 'OUT';

  @IsNotEmpty({ message: 'Line Asal / Vendor wajib diisi' })
  @IsString()
  lineAsal: string;

  @IsNotEmpty({ message: 'Waktu Manual wajib diisi' })
  @IsString()
  manualTimestamp: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  userId?: number;
}
