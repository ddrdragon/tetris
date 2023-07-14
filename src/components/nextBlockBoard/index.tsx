import React from "react";
import "./index.css";
import { create2DArray } from "../../util";

interface NextBlockBoardProps {
  nextBlock: number[][];
}
const NextBlockBoard = ({ nextBlock }: NextBlockBoardProps) => {
  const board = create2DArray(2, 4);

  for (let i = 0; i < nextBlock.length; i++) {
    for (let j = 0; j < nextBlock[0].length; j++) {
      board[i][j] = nextBlock[i][j];
    }
  }

  return (
    <div className="next-block-board">
      {board.flat().map((v, i) => (
        <div className={`brick state${v}`} key={i}></div>
      ))}
    </div>
  );
};

export default React.memo(NextBlockBoard);
