import React, { useState } from "react";
import "./App.css";
import Board, { BLOCKS } from "./Board";
import ScorePanel from "./ScorePanel";

function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nextBlock, setNextBlock] = useState<number[][]>(
    BLOCKS[Math.floor(Math.random() * BLOCKS.length)]
  );

  return (
    <div className="App">
      <Board
        level={level}
        setLevel={setLevel}
        nextBlock={nextBlock}
        setScore={setScore}
        setNextBlock={setNextBlock}
      />
      <ScorePanel score={score} level={level} nextBlock={nextBlock} />
    </div>
  );
}

export default App;
