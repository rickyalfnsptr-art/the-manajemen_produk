import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateThresholdDto {
  @IsNotEmpty({ message: 'Batas Minimum Stock tidak boleh kosong' })
  @IsInt({ message: 'Batas Minimum Stock harus berupa bilangan bulat' })
  @Min(0, { message: 'Batas Minimum Stock tidak boleh bernilai negatif' })
  minStock: number;

  @IsNotEmpty({ message: 'Batas Maximum Stock tidak boleh kosong' })
  @IsInt({ message: 'Batas Maximum Stock harus berupa bilangan bulat' })
  @Min(1, { message: 'Batas Maximum Stock minimal 1' })
  maxStock: number;
}
