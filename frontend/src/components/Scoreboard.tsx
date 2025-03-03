import React from "react";

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
  player1Id: string;
  player2Id: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  player1Score,
  player2Score,
  player1Id,
  player2Id,
}) => {
  return (
    <div className="scoreboard">
      <div className="score-item">
        <span className="player-name">{player1Id}:</span>
        <span className="score">{player1Score}</span>
      </div>
      <div className="score-item">
        <span className="player-name">{player2Id}:</span>
        <span className="score">{player2Score}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
