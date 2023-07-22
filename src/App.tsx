import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { BOARD_HEIGHT, BOARD_WIDTH, EMPTY_BOARD, EMPTY_LINE, LEVEL_UP_LINES, NEW_BLOCK_POSITION } from "./constant";
import { create2DArray, deepCopy2DArray, getRadomInt, getRandomBlock } from "./util";
import NextBlockBoard from "./components/nextBlockBoard";

enum GameStatus {
  StartMenu = "Start Menu",
  Playing = "Playing",
  Pause = "Pause",
  GameOver = "GameOver",
}

enum KeyState {
  ArrowDown = "ArrowDown",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
  ArrowUp = "ArrowUp",
  Enter = "Enter",
  Space = "Space",
  Escape = "Escape",
  KeyP = "KeyP",
}

const App = () => {
  const [highScore, setHighScore] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [clearedLines, setClearedLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextBlock, setNextBlock] = useState<number[][]>([]);
  const [startLevel, setStartLevel] = useState(1);
  const [startLines, setStartLines] = useState(0);

  const [board, setBoard] = useState<number[][]>(EMPTY_BOARD);
  const [gameStatus, setGameStatus] = useState(GameStatus.StartMenu);
  const [preventKeyEvent, setPreventKeyEvent] = useState(false);

  const [keyPressed, setKeyPressed] = useState<KeyState | null>(null);
  const [droppedTimer, setDroppedTimer] = useState<NodeJS.Timer | null>(null);

  const blockRef = useRef<number[][]>([]);
  const blockPositionRef = useRef([...NEW_BLOCK_POSITION]);
  const stabledBoardRef = useRef(board);

  console.log("lines", clearedLines);
  const canMoveDown = (stabledBoard: number[][], block: number[][], position: number[]) => {
    const [blockX, blockY] = position;

    if (blockY + getBlockHeight(block) >= BOARD_HEIGHT) return false;

    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i + 1;
          if (y >= 0 && y < BOARD_HEIGHT && stabledBoard[y][x] === 1) {
            return false;
          }
        }
      }
    }
    return true;
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

    if (blockY + getBlockHeight(block) > BOARD_HEIGHT) return false;

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
    const factor = Math.max(1, 1 + (level - 5) / 10);
    switch (lines) {
      case 1:
        return Math.floor(100 * factor);
      case 2:
        return Math.floor(250 * factor);
      case 3:
        return Math.floor(400 * factor);
      case 4:
        return Math.floor(600 * factor);
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

  const getBlockHeight = (block: number[][]) => {
    return block.length;
  };

  const getNewBoard = (board: number[][], block: number[][], position: number[]) => {
    const newBoard = deepCopy2DArray(board);
    const [blockX, blockY] = position;

    for (let i = 0; i < block.length; i++) {
      for (let j = 0; j < block[0].length; j++) {
        if (block[i][j] === 1) {
          const x = blockX + j;
          const y = blockY + i;
          if (y >= 0) {
            newBoard[y][x] = 1;
          }
        }
      }
    }

    return newBoard;
  };

  const getDroppedY = () => {
    while (canMoveDown(stabledBoardRef.current, blockRef.current, blockPositionRef.current)) {
      blockPositionRef.current[1]++;
    }
  };

  const clearLinesAndUpdateScoreLevel = (board: number[][]) => {
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

    setClearedLines((n) => {
      const newLines = n + lines;
      setLevel(Math.min(Math.floor(newLines / LEVEL_UP_LINES) + startLevel, 10));
      console.log("set", Math.floor(newLines / LEVEL_UP_LINES), startLevel);
      return newLines;
    });
    setScore((s) => s + getScore(lines) + 9 + level);
  };

  const updateBoard = () => {
    const board = getNewBoard(stabledBoardRef.current, blockRef.current, blockPositionRef.current);
    setBoard(board);
  };

  const updateNextBlock = () => {
    setNextBlock(getRandomBlock());
  };

  const moveLeft = () => {
    if (gameStatus !== GameStatus.Playing || droppedTimer) return;

    const [oldX, oldY] = blockPositionRef.current;
    const newPosition = [Math.max(0, oldX - 1), oldY];

    if (checkIfNoConflict(blockRef.current, newPosition)) {
      blockPositionRef.current = newPosition;
      updateBoard();
    }
  };

  const moveRight = () => {
    if (gameStatus !== GameStatus.Playing || droppedTimer) return;

    const [oldX, oldY] = blockPositionRef.current;
    const blockLength = getBlockWidth(blockRef.current);
    const newPosition = [Math.min(BOARD_WIDTH - blockLength, oldX + 1), oldY];

    if (checkIfNoConflict(blockRef.current, newPosition)) {
      blockPositionRef.current = newPosition;
      updateBoard();
    }
  };

  const spin = () => {
    if (gameStatus !== GameStatus.Playing || droppedTimer) return;

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
      updateBoard();
    }
  };

  const drop = () => {
    if (gameStatus !== GameStatus.Playing) return;

    getDroppedY();
    updateBoard();

    const id = setTimeout(() => {
      moveDown();
      setDroppedTimer(null);
    }, 250);
    setDroppedTimer(id);
  };

  const moveDown = () => {
    if (gameStatus !== GameStatus.Playing) return;

    if (canMoveDown(stabledBoardRef.current, blockRef.current, blockPositionRef.current)) {
      // move down block
      blockPositionRef.current[1]++;
      updateBoard();
    } else {
      const newBoard = getNewBoard(stabledBoardRef.current, blockRef.current, blockPositionRef.current);

      // clear lines or game over
      clearLinesAndUpdateScoreLevel(newBoard);

      // check if game over
      if (newBoard[0].find((v) => v === 1)) {
        setGameStatus(GameStatus.GameOver);
        const newScore = score + 1;
        const oldHighScoreStr = localStorage.getItem("high-score");
        if (oldHighScoreStr) {
          const oldHighScore = Number(oldHighScoreStr);
          if (newScore > oldHighScore) {
            localStorage.setItem("high-score", `${newScore}`);
            setHighScore(newScore);
          }
        } else {
          localStorage.setItem("high-score", `${newScore}`);
          setHighScore(newScore);
        }
        return;
      }

      stabledBoardRef.current = deepCopy2DArray(newBoard);
      blockRef.current = deepCopy2DArray(nextBlock);
      blockPositionRef.current = [...NEW_BLOCK_POSITION];
      updateBoard();
      updateNextBlock();

      if (keyPressed && keyPressed !== KeyState.Space) {
        setPreventKeyEvent(true);
      }
    }
  };

  // keyboard event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeyPressed(e.code as KeyState);
    };

    const handleKeyUp = () => {
      setKeyPressed(null);
      setPreventKeyEvent(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (preventKeyEvent) return;

    let id: NodeJS.Timer | null = null;
    switch (keyPressed) {
      case KeyState.ArrowLeft:
        moveLeft();
        id = setInterval(moveLeft, 100);
        break;
      case KeyState.ArrowRight:
        moveRight();
        id = setInterval(moveRight, 100);
        break;
      case KeyState.ArrowUp:
        spin();
        id = setInterval(spin, 300);
        break;
      case KeyState.ArrowDown:
        moveDown();
        id = setInterval(moveDown, 50);
        break;
      case KeyState.Space:
        // drop
        drop();
        setPreventKeyEvent(true);
        break;
      case KeyState.Enter:
        if (gameStatus === GameStatus.Pause) {
          resumeGame();
        } else {
          startGame();
        }
        setPreventKeyEvent(true);
        break;
      case KeyState.KeyP:
      case KeyState.Escape:
        if (gameStatus === GameStatus.Playing) {
          pauseGame();
        } else if (gameStatus === GameStatus.Pause) {
          resumeGame();
        }
        setPreventKeyEvent(true);
        break;
    }

    return () => {
      id && clearInterval(id);
    };
  }, [keyPressed, preventKeyEvent, gameStatus, nextBlock, droppedTimer, score]);

  // auto fall
  // todo: restart should reset interval
  useEffect(() => {
    if (droppedTimer) return;
    let id: NodeJS.Timer | null = null;
    if (gameStatus === GameStatus.Playing) {
      id = setInterval(moveDown, getLevelSpeed(level));
    }
    return () => {
      id && clearInterval(id);
    };
  }, [gameStatus, level, nextBlock, droppedTimer]);

  useEffect(() => {
    const highestScore = localStorage.getItem("high-score");
    if (highestScore) {
      setHighScore(JSON.parse(highestScore));
    } else {
      setHighScore(0);
    }
  }, []);

  const generateNewBoard = (lines: number) => {
    const newBoard = deepCopy2DArray(EMPTY_BOARD);
    for (let i = BOARD_HEIGHT - lines; i < BOARD_HEIGHT; i++) {
      let count = 0;
      for (let j = 0; j < BOARD_WIDTH; j++) {
        if (Math.random() > 0.5) {
          newBoard[i][j] = 1;
          count++;
        }
      }
      if (count === 0) {
        newBoard[i][getRadomInt(BOARD_WIDTH)] = 1;
      } else if (count === BOARD_WIDTH) {
        newBoard[i][getRadomInt(BOARD_WIDTH)] = 0;
      }
    }
    return newBoard;
  };

  const startGame = () => {
    const newBoard = generateNewBoard(startLines);

    setGameStatus(GameStatus.Playing);

    setScore(0);
    setLevel(startLevel);
    setBoard(newBoard);
    setClearedLines(0);

    updateNextBlock();
    blockRef.current = deepCopy2DArray(getRandomBlock());
    blockPositionRef.current = [4, -1];
    stabledBoardRef.current = newBoard;
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
    const newScore = score;
    const oldHighScoreStr = localStorage.getItem("high-score");
    if (oldHighScoreStr) {
      const oldHighScore = Number(oldHighScoreStr);
      if (newScore > oldHighScore) {
        localStorage.setItem("high-score", `${newScore}`);
        setHighScore(newScore);
      }
    } else {
      localStorage.setItem("high-score", `${newScore}`);
      setHighScore(newScore);
    }

    setGameStatus(GameStatus.StartMenu);

    setScore(0);
    setLevel(1);
    setBoard(EMPTY_BOARD);
    setClearedLines(0);

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

  const changeStartLevel = (n: number) => {
    setStartLevel(Math.max(1, Math.min(startLevel + n, 10)));
  };

  const changeStartLines = (n: number) => {
    setStartLines(Math.max(0, Math.min(startLines + n, 15)));
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
            <button onClick={endGame}>End</button>
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
        {/* high score */}
        <div>
          High Score: <b className="score">{highScore}</b>
        </div>

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
              <button onClick={endGame}>End Game</button>
            </>
          )}
          {gameStatus === GameStatus.Pause && (
            <>
              <button onClick={resumeGame}>Resume (P)</button>
              <button onClick={endGame}>End Game</button>
            </>
          )}
          {gameStatus === GameStatus.GameOver && (
            <>
              <button onClick={startGame}>Restart (Enter)</button>
              <button onClick={backToMenu}>End Game</button>
            </>
          )}
        </div>

        <br />
        {gameStatus === GameStatus.StartMenu && (
          <div className="start-control">
            <div className="control-item">
              <button onClick={() => changeStartLevel(-1)}>-</button>
              Start Level {startLevel}
              <button onClick={() => changeStartLevel(1)}>+</button>
            </div>
            <div className="control-item">
              <button onClick={() => changeStartLines(-1)}>-</button>
              Start Lines {startLines}
              <button onClick={() => changeStartLines(1)}>+</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
