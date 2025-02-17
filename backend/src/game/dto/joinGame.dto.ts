export interface JoinGameDto {
  gameMode: 'singleplayer' | 'localMultiplayer' | 'remoteMultiplayer';
  gameId?: string;
}
