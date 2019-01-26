import { scheduleWork } from './scheduler';
import * as Status from '../shared/status-work';
import {
  Update as UpdateEffect
} from '../shared/effect-tag';
import { isObject } from '../shared/validate';
import {
  NoEffect as NoHookEffect,
  UnmountSnapshot,
  UnmountMutation,
  MountMutation,
  MountLayout,
  UnmountPassive,
  MountPassive,
} from '../shared/with-effect';

//test
import { withState } from '../core/with-state';
import { lifeCycle } from '../core/life-cycle';
// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFNode = null;
// Hooks are stored as a linked list on the fiber's prevState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let firstCurrentWith = null;
let currentWith = null;
let firstWIPFNode = null;
let WIPWith = null;
let componentUpdateQueue = null;
// Updates scheduled during render will trigger an immediate re-render at the
// end of the current pass. We can't store these updates on the normal queue,
// because if the work is aborted, they should be discarded. Because this is
// a relatively rare case, we also don't want to add an additional field to
// either the hook or queue object types. So we store them in a lazily create
// map of queue -> render-phase updates, which are discarded once the component
// completes without re-rendering.
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
      currentWith = firstCurrentWith;
      WIPWith = firstWIPFNode;
    }
  } else {

    if (WIPWith.next === null) {
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
  // set work to this fiber
  // currentlyRenderingFNode.status = Status.Working;
  WIPWith = createWIPWith();

  let queue = WIPWith.queue;
  if (queue !== null) {
    // Already have a queue, so this is an update.

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
   const alternate = fnode.alternate;

   if (alternate !== null) {
     alternate.status = 1;
   }

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


 export function withLifeCycle(fnodeEffectTag, withEffectTag, lifeCycle) {
   currentlyRenderingFNode = getCurrentRenderingFNode();
   WIPWith = createWIPWith();
   const inputs = undefined;
   var nextInputs = inputs !== undefined && inputs !== null ? inputs : [];
   let destroyed = null;
   if (currentWith !== null) {
     // for componentdidupdate
     var prevEffect = currentWith.prevState;
     destroyed = prevEffect.destroy;
     if (inputsAreEqual(nextInputs, prevEffect.inputs)) {
       pushEffect(NoHookEffect, lifeCycle, destroyed);
       return;
     }
   }
   currentlyRenderingFNode.effectTag |= fnodeEffectTag;

   WIPWith.prevState = pushEffect(
     withEffectTag,
     lifeCycle,
     destroyed,
   );
 }

 function pushEffect(tag, lifeCycle, destroyed) {
   const { mounted, updated } = lifeCycle;
   const effect = {
     tag,
     mounted: mounted || null,
     updated: updated || null,
     destroyed: destroyed || null,
     inputs: [],
     // circular linked-list
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
