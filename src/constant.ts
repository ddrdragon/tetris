import { create2DArray } from "./util";

export const BLOCKS = [
  [
    [1, 1],
    [1, 1],
  ],
  [[1, 1, 1, 1]],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
];

export const BOARD_WIDTH = 10;

export const BOARD_HEIGHT = 18;

export const EMPTY_BOARD = create2DArray(BOARD_HEIGHT, BOARD_WIDTH);

export const EMPTY_LINE = new Array<number>(BOARD_WIDTH).fill(0);
