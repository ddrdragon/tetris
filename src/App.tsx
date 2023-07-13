import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { BLOCKS, BOARD_HEIGHT, BOARD_WIDTH, EMPTY_BOARD, EMPTY_LINE } from "./constant";
import { create2DArray, deepCopy2DArray, getRadomInt } from "./util";

const App = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nextBlock, setNextBlock] = useState<number[][]>(BLOCKS[getRadomInt(BLOCKS.length)]);
  const [scorePanelBoard, setScorePanelBoard] = useState(EMPTY_BOARD);

  const [board, setBoard] = useState<number[][]>(EMPTY_BOARD);
  const [isPaused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const currLevelRef = useRef(1);

  const blockRef = useRef(BLOCKS[getRadomInt(BLOCKS.length)]);
  const blockPositionRef = useRef([4, -1]);
  const stabledBoardRef = useRef(board);

  const isGameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const isTouchingRef = useRef(false);
  const invalidRef = useRef(false);

  const checkIsTouching = (block: number[][], position: number[]) => {
    const [blockX, blockY] = position;

    if (blockY + getBlockHeight() >= BOARD_HEIGHT) return true;

    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i + 1;
          if (y >= 0 && y < BOARD_HEIGHT && stabledBoardRef.current[y][x] === 1) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const checkIsInside = (block: number[][], position: number[]) => {
    const [blockX, blockY] = position;
    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i;
          if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const checkIfNoConflict = (block: number[][], position: number[]) => {
    const [blockX, blockY] = position;

    if (blockY + getBlockHeight() > BOARD_HEIGHT) return false;

    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i;
          if (y >= 0 && y < BOARD_HEIGHT && stabledBoardRef.current[y][x] === 1) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const getScore = (lines: number) => {
    switch (lines) {
      case 1:
        return 10;
      case 2:
        return 25;
      case 3:
        return 40;
      case 4:
        return 60;
      default:
        return 0;
    }
  };

  const getLevelSpeed = (level: number) => {
    return 1000 - (level - 1) * 100;
  };

  const getBlockWidth = (block: number[][]) => {
    return block[0].length;
  };

  const getBlockHeight = () => {
    return blockRef.current.length;
  };

  const moveLeft = () => {
    if (isPausedRef.current || isGameOverRef.current) return;

    const [oldX, oldY] = blockPositionRef.current;
    const newPosition = [Math.max(0, oldX - 1), oldY];

    if (checkIfNoConflict(blockRef.current, newPosition)) {
      blockPositionRef.current = newPosition;
    } else {
      invalidRef.current = true;
    }

    updateBoard();
  };

  const moveRight = () => {
    if (isPausedRef.current || isGameOverRef.current) return;

    const [oldX, oldY] = blockPositionRef.current;
    const blockLength = getBlockWidth(blockRef.current);
    const newPosition = [Math.min(BOARD_WIDTH - blockLength, oldX + 1), oldY];
    if (checkIfNoConflict(blockRef.current, newPosition)) {
      blockPositionRef.current = newPosition;
    } else {
      invalidRef.current = true;
    }

    updateBoard();
  };

  const moveDown = () => {
    if (isPausedRef.current || isGameOverRef.current) return;

    if (checkIsTouching(blockRef.current, blockPositionRef.current)) {
      isTouchingRef.current = true;
    } else {
      isTouchingRef.current = false;
      blockPositionRef.current[1]++;
    }

    updateBoard();
  };

  const spin = () => {
    if (isPausedRef.current) return;

    const oldBlock = blockRef.current;
    const oldBlockHeight = oldBlock.length;
    const oldBlockWidth = oldBlock[0].length;

    const newBlockArray: number[] = [];
    for (let i = 0; i < oldBlockWidth; i++) {
      for (let j = oldBlockHeight - 1; j >= 0; j--) {
        newBlockArray.push(oldBlock[j][i]);
      }
    }

    const newBlock = create2DArray(oldBlockWidth, oldBlockHeight);
    for (let i = 0; i < newBlockArray.length; i++) {
      const r = Math.floor(i / oldBlockHeight);
      const c = i % oldBlockHeight;
      newBlock[r][c] = newBlockArray[i];
    }

    // is new block inside or no conflict
    if (checkIsInside(newBlock, blockPositionRef.current) && checkIfNoConflict(newBlock, blockPositionRef.current)) {
      blockRef.current = newBlock;
    }

    updateBoard();
  };

  const handlePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setPaused((p) => !p);
  };

  const resetGame = () => {
    setBoard(EMPTY_BOARD);
    setScore(0);
    setNextBlock(BLOCKS[getRadomInt(BLOCKS.length)]);
    isPausedRef.current = false;
    setPaused(false);
    stabledBoardRef.current = EMPTY_BOARD;
    blockPositionRef.current = [4, 0];
    blockRef.current = deepCopy2DArray(nextBlock);
    setLevel(1);
    currLevelRef.current = 1;
    setGameOver(false);
    isGameOverRef.current = false;
    moveDown();
  };

  const addBlockToBoard = (board: number[][], block: number[][]) => {
    const [blockX, blockY] = blockPositionRef.current;
    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i;
          if (y >= 0) {
            board[y][x] = 1;
          }
        }
      }
    }
  };

  const handleClearLines = (board: number[][]) => {
    let lines = 0;
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      let isFull = true;
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if (board[row][col] === 0) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        board.splice(row, 1);
        board.unshift([...EMPTY_LINE]);
        lines++;
      }
    }
    return lines;
  };

  const updateBoard = () => {
    const newBoard = deepCopy2DArray(stabledBoardRef.current);
    const newBlock = deepCopy2DArray(blockRef.current);

    addBlockToBoard(newBoard, newBlock);

    if (isTouchingRef.current) {
      // if need clear lines
      const lines = handleClearLines(newBoard);

      setScore((s) => {
        setLevel(Math.floor((s + getScore(lines) + 1) / 1000) + 1);
        return s + getScore(lines) + 1;
      });

      // check if game over
      if (newBoard[0].find((v) => v === 1)) {
        handlePause();
        setGameOver(true);
        isGameOverRef.current = true;
        return;
      }

      stabledBoardRef.current = deepCopy2DArray(newBoard);
      blockRef.current = deepCopy2DArray(nextBlock);
      blockPositionRef.current = [4, -1];
      isTouchingRef.current = false;

      addBlockToBoard(newBoard, blockRef.current);
      setNextBlock(BLOCKS[getRadomInt(BLOCKS.length)]);
    }

    setBoard(newBoard);
  };

  // init board
  useEffect(() => {
    updateBoard();
  }, []);

  // keyboard event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowRight":
          moveRight();
          break;
        case "ArrowLeft":
          moveLeft();
          break;
        case "ArrowDown":
          moveDown();
          break;
        case "ArrowUp":
          spin();
          break;
        case "Enter":
          resetGame();
          break;
        case "Space":
          handlePause();
          break;
        default:
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextBlock]);

  // auto fall
  useEffect(() => {
    let id: NodeJS.Timer | null = null;
    if (level !== currLevelRef.current) {
      currLevelRef.current = level;
      id && clearInterval(id);
      id = id = setInterval(() => {
        moveDown();
        updateBoard();
      }, getLevelSpeed(level));
    } else {
      if (isPaused) {
        id && clearInterval(id);
      } else {
        id = setInterval(() => {
          moveDown();
          updateBoard();
        }, getLevelSpeed(level));
      }
    }
    return () => {
      id && clearInterval(id);
    };
  }, [isPaused, nextBlock, level]);

  useEffect(() => {
    const newBoard = create2DArray(2, 4);
    for (let i = 0; i < nextBlock.length; i++) {
      for (let j = 0; j < nextBlock[0].length; j++) {
        newBoard[i][j] = nextBlock[i][j];
      }
    }
    setScorePanelBoard(newBoard);
  }, [nextBlock]);

  return (
    <div className="App">
      <div className={"board"}>
        {gameOver && (
          <div className="game-over">
            <h3>Game Over</h3>
            <button onClick={resetGame}>Restart</button>
          </div>
        )}
        {isPaused && !gameOver && (
          <div className="game-over">
            <h3>Pause</h3>
            <button onClick={handlePause}>Resume</button>
          </div>
        )}
        {board.flat().map((v, i) => (
          <div className={`brick state${v}`} key={i}></div>
        ))}
      </div>
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
            {scorePanelBoard.flat().map((v, i) => (
              <div className={`brick state${v}`} key={i}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
