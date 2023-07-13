export const create2DArray = (r: number, c: number) => {
  const row = new Array(c).fill(0);
  const array: number[][] = [];
  for (let i = 0; i < r; i++) {
    array.push([...row]);
  }
  return array;
};

export const deepCopy2DArray = (arr: number[][]) => {
  const copy: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const row = [...arr[i]];
    copy.push(row);
  }
  return copy;
};

export const getRadomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};
