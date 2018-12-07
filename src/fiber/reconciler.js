import { createFRoot } from './f-node';
import { scheduleWork } from './scheduler';
// import { enqueueUpdate, createUpdate } from './queue';
import { createRootRender } from './root-render';

export function createContainer(container) {
  return createFRoot(container);
}

export function updateContainer(el, FRoot) {
  const current = FRoot.current;
  return scheduleRootUpdate(current, el);
}

// before scheduler a work we will set update to a queue
function scheduleRootUpdate(current, el) {
  // const update = createUpdate();
  // update.payload = { element: el };
  const rootRender = createRootRender(el);
  // enqueueUpdate(current, update);
  current.rootRender = rootRender;

  scheduleWork(current);
}
