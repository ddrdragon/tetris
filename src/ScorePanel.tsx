import React, { useEffect, useMemo, useState } from "react";
import "./ScorePanel.css";
import { create2DArray } from "./Board";

interface ScorePanelProps {
  score: number;
  level: number;
  nextBlock: number[][];
}

const EMPTY_BOARD = create2DArray(4, 4);

const ScorePanel = ({ score, level, nextBlock }: ScorePanelProps) => {
  const [board, setBoard] = useState(EMPTY_BOARD);

  useEffect(() => {
    const newBoard = create2DArray(4, 4);
    for (let i = 0; i < nextBlock.length; i++) {
      for (let j = 0; j < nextBlock[0].length; j++) {
        newBoard[i][j] = nextBlock[i][j];
      }
    }
    setBoard(newBoard);
  }, [nextBlock]);

  return (
    <div className="scorePanel">
      <div>
        Score: <b className="score">{score}</b>
      </div>
      <div>
        Level: <b className="score">{level}</b>
      </div>
      <br />
      <div>
        Next:
        <div className={"next-block"}>
          {board.flat().map((v, i) => (
            <div className={`brick state${v}`} key={i}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;
