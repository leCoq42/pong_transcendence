import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class MovePaddleDto {
  @IsNotEmpty()
  @IsString()
  gameId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';

  @IsOptional()
  @IsNumber()
  player?: number;
}
