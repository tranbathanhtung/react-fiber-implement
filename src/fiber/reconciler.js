// @flow
import type { VNodeElement, Container } from '../shared/types';
import type { FNode, FRoot } from './f-node';

import { createFRoot } from './f-node';
import { scheduleWork } from './scheduler';
import { createRootRender } from './root-render';

export function createContainer(container: Container): FRoot {
  return createFRoot(container);
}

export function updateContainer(el: VNodeElement, FRoot: FRoot): void {
  const current = FRoot.current;
  return scheduleRootUpdate(current, el);
}

function scheduleRootUpdate(current: FNode, el: VNodeElement): void {
  const rootRender = createRootRender(el);
  current.rootRender = rootRender;

  scheduleWork(current);
}
