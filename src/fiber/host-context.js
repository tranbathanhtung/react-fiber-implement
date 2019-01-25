/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {StackCursor} from './stack';
import {createCursor, push, pop} from './stack';

declare class NoContextT {}
const NO_CONTEXT: NoContextT = ({}: any);

let rootInstanceStackCursor: StackCursor<T> = createCursor(
  NO_CONTEXT,
);

function requiredContext<Value>(c: Value | NoContextT): Value {
  return (c: any);
}

function getRootHostContainer() {
  const rootInstance = requiredContext(rootInstanceStackCursor.current);
  return rootInstance;
}

function pushHostContainer(fiber, nextRootInstance) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber);
}

function popHostContainer(fiber) {
  pop(rootInstanceStackCursor, fiber);
}

export {
  getRootHostContainer,
  popHostContainer,
  pushHostContainer,
};
