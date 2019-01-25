/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
export type StackCursor<T> = {
  current: T,
};

const valueStack: Array<any> = [];

let fiberStack: Array<any>;

let index = -1;

function createCursor<T>(defaultValue: T): StackCursor<T> {
  return {
    current: defaultValue,
  };
}

function isEmpty(): boolean {
  return index === -1;
}

function pop<T>(cursor: StackCursor<T>, fiber): void {
  if (index < 0) {
    return;
  }

  cursor.current = valueStack[index];
  valueStack[index] = null;
  // fiberStack[index] = null;
  index--;
}

function push<T>(cursor: StackCursor<T>, value: T, fiber): void {
  index++;

  valueStack[index] = cursor.current;
  // fiberStack[index] = fiber;

  cursor.current = value;
}

export {
  createCursor,
  isEmpty,
  pop,
  push,
};
