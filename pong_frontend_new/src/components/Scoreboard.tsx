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
      <p>Player 1: {player1Score}</p>
      <p>Player 2: {player2Score}</p>
    </div>
  );
};

export default Scoreboard;
