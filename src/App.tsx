import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { BOARD_HEIGHT, BOARD_WIDTH, EMPTY_BOARD, EMPTY_LINE, NEW_BLOCK_POSITION } from "./constant";
import { create2DArray, deepCopy2DArray, getRandomBlock } from "./util";
import NextBlockBoard from "./components/nextBlockBoard";

enum GameStatus {
  StartMenu = "Start Menu",
  Playing = "Playing",
  Pause = "Pause",
  GameOver = "GameOver",
}

const App = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nextBlock, setNextBlock] = useState<number[][]>([]);

  const [board, setBoard] = useState<number[][]>(EMPTY_BOARD);
  const [gameStatus, setGameStatus] = useState(GameStatus.StartMenu);

  const blockRef = useRef<number[][]>([]);
  const blockPositionRef = useRef(NEW_BLOCK_POSITION);
  const stabledBoardRef = useRef(board);

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
    if (gameStatus !== GameStatus.Playing) return;

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
    if (gameStatus !== GameStatus.Playing) return;

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
    if (gameStatus !== GameStatus.Playing) return;

    if (checkIsTouching(blockRef.current, blockPositionRef.current)) {
      isTouchingRef.current = true;
    } else {
      isTouchingRef.current = false;
      blockPositionRef.current = [...blockPositionRef.current];
      blockPositionRef.current[1]++;
    }

    updateBoard();
  };

  const spin = () => {
    if (gameStatus !== GameStatus.Playing) return;

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

  const updateNextBlock = () => {
    setNextBlock(getRandomBlock());
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
        setGameStatus(GameStatus.GameOver);
        return;
      }

      stabledBoardRef.current = deepCopy2DArray(newBoard);
      blockRef.current = deepCopy2DArray(nextBlock);
      blockPositionRef.current = NEW_BLOCK_POSITION;
      isTouchingRef.current = false;

      addBlockToBoard(newBoard, blockRef.current);
      updateNextBlock();
    }

    setBoard(newBoard);
  };

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
          // should check before restart
          startGame();
          break;
        case "Space":
          // drop
          break;
        case "KeyP":
          if (gameStatus === GameStatus.Playing) {
            pauseGame();
          } else if (gameStatus === GameStatus.Pause) {
            resumeGame();
          }
          break;
        case "Escape":
          endGame();
          break;
        default:
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextBlock, gameStatus]);

  // auto fall
  // todo: restart should reset interval
  useEffect(() => {
    let id: NodeJS.Timer | null = null;
    if (gameStatus === GameStatus.Playing) {
      id = setInterval(moveDown, getLevelSpeed(level));
    }
    return () => {
      id && clearInterval(id);
    };
  }, [gameStatus, level]);

  const startGame = () => {
    setGameStatus(GameStatus.Playing);

    setScore(0);
    setLevel(1);
    setBoard(EMPTY_BOARD);

    updateNextBlock();
    blockRef.current = deepCopy2DArray(getRandomBlock());
    blockPositionRef.current = [4, -1];
    stabledBoardRef.current = EMPTY_BOARD;
  };

  const pauseGame = () => {
    setGameStatus(GameStatus.Pause);
  };

  const resumeGame = () => {
    setGameStatus(GameStatus.Playing);
  };

  // manully end game while play
  // todo: should popup a socre panel
  const endGame = () => {
    setGameStatus(GameStatus.StartMenu);

    setScore(0);
    setLevel(1);
    setBoard(EMPTY_BOARD);

    setNextBlock([]);

    blockRef.current = [];
    blockPositionRef.current = NEW_BLOCK_POSITION;
    stabledBoardRef.current = EMPTY_BOARD;
  };

  // after game over
  const backToMenu = () => {
    setGameStatus(GameStatus.StartMenu);

    setScore(0);
    setLevel(1);
    setBoard(EMPTY_BOARD);

    setNextBlock([]);

    blockRef.current = [];
    blockPositionRef.current = NEW_BLOCK_POSITION;
    stabledBoardRef.current = EMPTY_BOARD;
  };

  return (
    <div className="App">
      <div className={"board"}>
        {board.flat().map((v, i) => (
          <div className={`outer-brick state${v}`} key={i}>
            <div className={`inner-brick state${v}`}></div>
          </div>
        ))}
        {gameStatus === GameStatus.GameOver && (
          <div className="popup-menu">
            <h3>Game Over</h3>
            <button onClick={startGame}>Restart</button>
          </div>
        )}
        {gameStatus === GameStatus.Pause && (
          <div className="popup-menu">
            <h3>Pause</h3>
            <button onClick={resumeGame}>Resume</button>
          </div>
        )}
      </div>
      <div className="scorePanel">
        {/* score */}
        <div>
          Score: <b className="score">{score}</b>
        </div>

        {/* level */}
        <div>
          Level: <b className="score">{level}</b>
        </div>
        <br />

        {/* next block */}
        <div>
          Next:
          <NextBlockBoard nextBlock={nextBlock} />
        </div>
        <br />

        {/* buttons */}
        <div className="controls">
          {gameStatus === GameStatus.StartMenu && <button onClick={startGame}>Start (Enter)</button>}
          {gameStatus === GameStatus.Playing && (
            <>
              <button onClick={pauseGame}>Pause (P)</button>
              <button onClick={startGame}>Restart (Enter)</button>
              <button onClick={endGame}>End (ESC)</button>
            </>
          )}
          {gameStatus === GameStatus.Pause && (
            <>
              <button onClick={resumeGame}>Resume (P)</button>
              <button onClick={endGame}>End (ESC)</button>
            </>
          )}
          {gameStatus === GameStatus.GameOver && (
            <>
              <button onClick={startGame}>Restart (Enter)</button>
              <button onClick={backToMenu}>End (ESC)</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
