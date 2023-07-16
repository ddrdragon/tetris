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
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nextBlock, setNextBlock] = useState<number[][]>([]);

  const [board, setBoard] = useState<number[][]>(EMPTY_BOARD);
  const [gameStatus, setGameStatus] = useState(GameStatus.StartMenu);
  const [preventKeyEvent, setPreventKeyEvent] = useState(false);

  const [keyPressed, setKeyPressed] = useState<KeyState | null>(null);
  const [droppedTimer, setDroppedTimer] = useState<NodeJS.Timer | null>(null);

  const blockRef = useRef<number[][]>([]);
  const blockPositionRef = useRef([...NEW_BLOCK_POSITION]);
  const stabledBoardRef = useRef(board);

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

    setScore((s) => {
      setLevel(Math.floor((s + getScore(lines) + 1) / 1000) + 1);
      return s + getScore(lines) + 1;
    });
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
        startGame();
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
  }, [keyPressed, preventKeyEvent, gameStatus, nextBlock, droppedTimer]);

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
      </div>
    </div>
  );
};

export default App;
