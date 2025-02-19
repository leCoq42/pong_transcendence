import React from "react";

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  player1Score,
  player2Score,
}) => {
  return (
    <div className="scoreboard">
      <div className="score-item">
        <span className="player-name">P1</span>
        <span className="score">{player1Score}</span>
      </div>
      <div className="score-item">
        <span className="player-name">P2</span>
        <span className="score">{player2Score}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
