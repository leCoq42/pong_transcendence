import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class MovePaddleDto {
  @IsNotEmpty()
  @IsString()
  gameId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';
}