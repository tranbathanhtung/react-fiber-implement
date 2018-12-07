import { scheduleWork } from './scheduler';
import * as Status from '../shared/status-work';
import {
  Update as UpdateEffect
} from '../shared/effect-tag';
import {
  NoEffect as NoHookEffect,
  UnmountSnapshot,
  UnmountMutation,
  MountMutation,
  MountLayout,
  UnmountPassive,
  MountPassive,
} from '../shared/with-effect';
// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFNode = null;
// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let firstCurrentWith = null;
let currentWith = null;
let firstWIPFNode = null;
let componentUpdateQueue = null;
let WIPWith = null;
// Updates scheduled during render will trigger an immediate re-render at the
// end of the current pass. We can't store these updates on the normal queue,
// because if the work is aborted, they should be discarded. Because this is
// a relatively rare case, we also don't want to add an additional field to
// either the hook or queue object types. So we store them in a lazily create
// map of queue -> render-phase updates, which are discarded once the component
// completes without re-rendering.

// Whether the work-in-progress hook is a re-rendered hook
let isReRender = false;
// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate = false;
// Lazily created map of render-phase updates
let renderPhaseUpdates = null;
// Counter to prevent infinite loops.
let numberOfReRenders = 0;
const RE_RENDER_LIMIT = 25;

function getCurrentRenderingFNode() {
  return currentlyRenderingFNode;
}

export function prepareWithState(current, WIP) {
  currentlyRenderingFNode = WIP;
  firstCurrentWith = current !== null ? current.prevState : null;
}

export function finishedWith(Component, props, children) {
  // This must be called after every function component to prevent hooks from
  // being used in classes.
  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    currentHook = null;
    workInProgressHook = null;
    componentUpdateQueue = null;

    children = Component(props);
  }
  renderPhaseUpdates = null;
  numberOfReRenders = 0;
  const renderedWork = currentlyRenderingFNode;
  renderedWork.prevState = firstWIPFNode;
  renderedWork.lifeCycle = componentUpdateQueue;

  currentlyRenderingFNode = null;
  currentWith = null;
  firstCurrentWith = null;
  firstWIPFNode = null;
  WIPWith = null;

  componentUpdateQueue = null;

  return children;
}

export function resetWiths() {
  // This is called instead of `finishHooks` if the component throws. It's also
  // called inside mountIndeterminateComponent if we determine the component
  // is a module-style component.
  currentlyRenderingFNode = null;

  firstCurrentWith = null;
  currentWith = null;
  firstWIPFNode = null;
  WIPWith = null;

  componentUpdateQueue = null;

  // Always set during createWorkInProgress
  // isReRender = false;

  didScheduleRenderPhaseUpdate = false;
  renderPhaseUpdates = null;
  numberOfReRenders = 0;
}

function createWith() {
  return {
    prevState: null,

    baseState: null,
    queue: null,
    baseUpdate: null,

    next: null
  }
}

function cloneWith(With) {
  return {
    prevState: With.prevState,

    baseState: With.prevState,
    queue: With.queue,
    baseUpdate: With.baseUpdate,

    next: null,
  };
}

function createWIPWith() {

  if (WIPWith === null) {
    // this is the first hook in the list
    if (firstWIPFNode === null) {
      isReRender = false;
      currentWith = firstCurrentWith;
      if (currentWith === null) {
        // This is a newly mounted hook
        WIPWith = createWith();
      } else {
        // clone the current with
        WIPWith = cloneWith(currentWith);
      }
      firstWIPFNode = WIPWith;
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      currentWith = firstCurrentWith;
      WIPWith = firstWIPFNode;
    }
  } else {

    if (WIPWith.next === null) {
      isReRender = false;
      let With;
      if (currentWith === null) {
        // This is a newly mounted hook
        With = createWith();
      } else {
        // clone
        currentWith = currentWith.next;
        if (currentWith === null) {
          // This is a newly mounted hook
          With = createWith();
        } else {
          // Clone the current hook.
          With = cloneWith(currentWith);
        }
      }
      // Append to the end of the list
      WIPWith = WIPWith.next = With;
    }
    else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      WIPWith = WIPWith.next;
      currentWith = currentWith !== null ? currentWith.next : null;
    }

  }

  return WIPWith;
}

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

// export const generalId = () => {
//   return '_' + Math.random().toString(36).substr(2, 9);
// };

export function withReducer(initialState) {
  // const id = generalId();
  currentlyRenderingFNode = getCurrentRenderingFNode();
  // console.log('currentlyRenderingFNode', currentlyRenderingFNode)
  // set work to this fiber
  // currentlyRenderingFNode.status = Status.Working;
  WIPWith = createWIPWith();

  let queue = WIPWith.queue;
  if (queue !== null) {
    // Already have a queue, so this is an update.
    if (isReRender) {
      // This is a re-render. Apply the new render phase updates to the previous
      // work-in-progress hook.
    }
    // The last update in the entire queue
    const last = queue.last;
    // The last update that is part of the base state.
    const baseUpdate = WIPWith.baseUpdate;
    // Find the first unprocessed update.
    let first;
    if (baseUpdate !== null) {
      if (last !== null) {
        // For the first update, the queue is a circular linked list where
        // `queue.last.next = queue.first`. Once the first update commits, and
        // the `baseUpdate` is no longer empty, we can unravel the list.
        last.next = null;
      }
      first = baseUpdate.next;
    } else {
      first = last !== null ? last.next : null;
    }
    if (first !== null) {
      let newState = WIPWith.baseState;
      let newBaseState = null;
      let newBaseUpdate = null;
      let prevUpdate = baseUpdate;
      let update = first;
      let didSkip = false;
      do {
        const action = update.action;
        newState = basicStateReducer(newState, action);
        prevUpdate = update;
        update = update.next;
      } while(update !== null && update !== first)

      if (!didSkip) {
        newBaseUpdate = prevUpdate;
        newBaseState = newState;
      }

      WIPWith.prevState = newState;
      WIPWith.baseUpdate = newBaseUpdate;
      WIPWith.baseState = newBaseState;

    }

    const dispatch = queue.dispatch;
    return [WIPWith.prevState, dispatch];
  }
  // There's no existing queue, so this is the initial render.
  // if (true) {
  //
  // }
  WIPWith.prevState = WIPWith.baseState = initialState;
  queue = WIPWith.queue = {
    last: null,
    dispatch: null,
  };
  const dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingFNode, queue);

  return [WIPWith.prevState, dispatch]
 }

 function dispatchAction(fnode, queue, action) {
   fnode.status = 1;
   console.log('fnode', fnode)
   const alternate = fnode.alternate;

   if (alternate !== null) {
     alternate.status = 1;
   }

   if (1 === 2) {

   } else {
     const update = {
       action,
       next: null,
     }
     // flushPassiveEffects();
     // append the update to the end of the list
     const last = queue.last;
     if (last === null) {
       // This is the first update. Create a circular list.
       update.next = update;

     } else {
       const first = last.next;
       if (first !== null) {
        // Still circular.
        update.next = first;
        }
        last.next = update;
     }
     queue.last = update;
     scheduleWork(fnode);
   }
 }


 export function withLifeCycle(fnodeEffectTag, withEffectTag, lifeCycle) {
   currentlyRenderingFNode = getCurrentRenderingFNode();
   WIPWith = createWIPWith();
   console.log('currentlyRenderingFNode', currentlyRenderingFNode);
   if (currentWith !== null) {
     // for componentdidupdate
   }

   currentlyRenderingFNode.effectTag |= fnodeEffectTag;
   WIPWith.prevState = pushEffect(
     withEffectTag,
     lifeCycle
   );
 }

 function pushEffect(tag, lifeCycle) {
   const { mounted, destroyed, updated } = lifeCycle;
   const effect = {
     tag,
     mounted: mounted || null,
     updated: updated || null,
     destroyed: destroyed || null,
     // circular
     next: null,
   };
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
 }

 function createFunctionComponentUpdateQueue() {
   return {
     lastEffect: null,
   }
 }

 function inputsAreEqual(arr1, arr2) {
  // Don't bother comparing lengths in prod because these arrays should be
  // passed inline.
  if (__DEV__) {
    warning(
      arr1.length === arr2.length,
      'Detected a variable number of hook dependencies. The length of the ' +
        'dependencies array should be constant between renders.\n\n' +
        'Previous: %s\n' +
        'Incoming: %s',
      arr1.join(', '),
      arr2.join(', '),
    );
  }
  for (let i = 0; i < arr1.length; i++) {
    // Inlined Object.is polyfill.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
    const val1 = arr1[i];
    const val2 = arr2[i];
    if (
      (val1 === val2 && (val1 !== 0 || 1 / val1 === 1 / (val2: any))) ||
      (val1 !== val1 && val2 !== val2) // eslint-disable-line no-self-compare
    ) {
      continue;
    }
    return false;
  }
  return true;
}
