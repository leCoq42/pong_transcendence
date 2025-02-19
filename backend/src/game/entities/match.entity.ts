import { Column, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'match_history' })
export class Match extends Model {
  @Column
  player1Id: string;

  @Column
  player2Id: string;

  @Column
  player1Score: number;

  @Column
  player2Score: number;

  @Column
  gameMode: string;

  @Column
  startTime: Date;

  @Column
  endTime: Date;

  @Column
  winnerId: string;
}
