// @flow
import type { FNode, FRoot } from './f-node';

import {
  Root,
  Text,
  DNode,
  FComponent,
} from '../shared/tag';
import {
  Incomplete,
  NoEffect,
  PerformedWork,
  Placement,
  Deletion,
  Update,
  Passive,
  PlacementAndUpdate
} from '../shared/effect-tag';
import {
  UnmountLayout,
  MountLayout
} from '../shared/with-effect';
import { createWIP } from './f-node';
import { beginWork } from './begin-work';
import { completeWork } from './complete-work';
import {
  commitPlacement,
  commitDeletion,
  commitWork,
  commitPassiveWithEffects,
  commitWithEffectList
} from './commit-work';
import { resetWiths } from './f-with';
import { callLifeCycle } from './f-life-cycle';
import { LinkedList } from '../structures/linked-list';
const expireTime = 1;

let nextUnitOfWork = null;
let nextEffect = null;

let rootWithPendingPassiveEffects = null;

export function scheduleWork(fnode: FNode): void {
  const root = getRootFromFnode(fnode);
  if (root === null) {
    // clone here
    return;
  }
  resetWiths();
  requestIdleCallback(dl => performWork(dl, root))
}

function getRootFromFnode(fnode: FNode): FRoot {
  let node = fnode;
  if (fnode !== null && node.tag === Root && node.return === null) {
    return fnode.instanceNode;
  }
  node = node.return;
  return getRootFromFnode(node);
}

function performWork(dl: any, root: FRoot): void {
  workLoop(dl, root);
  if (nextUnitOfWork) {
    requestIdleCallback(dl => performWork(dl, root));
  }
  if (nextUnitOfWork === null) {
    let finishedWork = root.current.alternate;
    if (finishedWork) {
      // complete Root
      completeRoot(root, finishedWork)
    }
  }
}

function workLoop(dl: any, root: FRoot): void {
  if (!nextUnitOfWork) {
    nextUnitOfWork = createWIP(root.current, null);
  }
  while (nextUnitOfWork !== null && dl.timeRemaining() > expireTime) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function performUnitOfWork(WIP: FNode): FNode {
  const current = WIP.alternate;
  let next;
  next = beginWork(current, WIP);
  WIP.prevProps = WIP.props;
  if (next === null) {
    next = completeUnitOfWork(WIP);
  }
  return next;
}

function completeUnitOfWork(WIP: FNode): FNode | null {
  // Attempt to complete the current unit of work, then move to the
  // next sibling. If there are no more siblings, return to the
  // parent fiber.

  while (true) {
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.
    const current = WIP.alternate;
    const returnFNode = WIP.return;

    const siblingFNode = WIP.sibling;
    if ((WIP.effectTag & Incomplete) === NoEffect) {
      // completeWork work to create instanceNode of this WIP
      let next = completeWork(current, WIP);
      if (next !== null) {
        return next;
      }

      if (returnFNode !== null &&
        // Do not append effects to parents if a sibling failed to complete
        (returnFNode.effectTag & Incomplete) === NoEffect) {
          returnFNode.linkedList.addEffectToParent(WIP);
          // If this fiber had side-effects, we append it AFTER the children's
          // side-effects. We can perform certain side-effects earlier if
          // needed, by doing multiple passes over the effect list. We don't want
          // to schedule our own side-effect on our own list because if end up
          // reusing children we'll schedule this effect onto itself since we're
          // at the end.
          let effectTag = WIP.effectTag;
          // Skip both NoWork and PerformedWork tags when creating the effect list.
          // PerformedWork effect is read by React DevTools but shouldn't be committed.
          if (effectTag > PerformedWork) {
            returnFNode.linkedList.add(WIP)
          }
      }

      if (siblingFNode !== null) {
        // If there is more work to do in this returnFNode, do that next.
        return siblingFNode;
      } else if (returnFNode !== null) {
        // If there's no more work in this returnFNode. Complete the returnFNode.
        WIP = returnFNode;
        continue;
      } else {
        // We've reached the root.
        return null;
      }
    } else {
      if (siblingFNode !== null) {
        // If there is more work to do in this returnFNode, do that next.
        return siblingFNode;
      } else if (returnFNode !== null) {
        // If there's no more work in this returnFNode. Complete the returnFNode.
        WIP = returnFNode;
        continue;
      } else {
        return null;
      }
    }

  }

  return null
}

export function completeRoot(
  root: FRoot,
  finishedWork: FNode,
): void {
  // Commit the root.
  root.finishedWork = null;
  commitRoot(root, finishedWork);
}

export function commitRoot(root: FRoot, finishedWork: FNode): void {
  let firstEffect;
  const linkedList = finishedWork.linkedList;

  if (finishedWork.effectTag > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if
    // it had one; that is, all the effects in the tree including the root.
    if (linkedList.last !== null) {
      linkedList.last.next = finishedWork;
      firstEffect = linkedList.first;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // There is no effect on the root.
    firstEffect = linkedList.first;;
  }

  nextEffect = firstEffect;

  while (nextEffect !== null) {
    commitAllHostEffects()
    if (nextEffect !== null) {
        nextEffect = nextEffect.next;
    }
  }

  // Invoke instances of getSnapshotBeforeUpdate before mutation.



  // The work-in-progress tree is now the current tree. This must come after
  // the first pass of the commit phase, so that the previous tree is still
  // current during componentWillUnmount, but before the second pass, so that
  // the finished work is current during componentDidMount/Update.
  root.current = finishedWork;

  // In the second pass we'll perform all life-cycles and ref callbacks.
  // Life-cycles happen as a separate pass so that all placements, updates,
  // and deletions in the entire tree have already been invoked.
  // This pass also triggers any renderer-specific initial effects.
  nextEffect = firstEffect;

  //commitAllLifeCircleHere
  while (nextEffect !== null) {
    commitAllLifeCycles(root);
    if (nextEffect !== null) {
      nextEffect = nextEffect.next;
    }
  }

  // This commit included a passive effect. These do not need to fire until
  // after the next paint. Schedule an callback to fire them in an async
  // event. To ensure serial execution, the callback will be flushed early if
  // we enter rootWithPendingPassiveEffects commit phase before then.
  if(
    firstEffect !== null
    && rootWithPendingPassiveEffects !== null
  ) {
    let callback = commitPassiveEffects.bind(null, root, firstEffect);
    callLifeCycle(callback);
  }
}

function commitPassiveEffects(root: FRoot, firstEffect: FNode): void {
  rootWithPendingPassiveEffects = null;
  let effect = firstEffect;
  do {
    if (effect.effectTag & Passive) {
      try {
        commitPassiveWithEffects(effect);
      } catch(err) {
        console.log(err)
      }
    }
    effect = effect.next;
  } while(effect !== null)
}

function commitAllHostEffects() {

  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every
    // possible bitmap value, we remove the secondary effects from the
    // effect tag and switch on that value.
    let primaryEffectTag = effectTag & (Placement | Update | Deletion);
    switch (primaryEffectTag) {
      case Placement: {
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is inserted, before
        // any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted
        // does and isMounted is deprecated anyway so we should be able
        // to kill this.
        nextEffect.effectTag &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        // Placement
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is inserted, before
        // any life-cycles like componentDidMount gets called.
        nextEffect.effectTag &= ~Placement;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      };
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        commitDeletion(nextEffect);
        break;
      }
      default:
        break;
    }
    nextEffect = nextEffect.next;

  }
}


function commitAllLifeCycles(finishedRoot) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    if (effectTag & Update) {
      const current = nextEffect.alternate;
      commitLifeCycles(finishedRoot, current, nextEffect);
    }
    if (effectTag & Passive) {
      rootWithPendingPassiveEffects = finishedRoot;
    }
    nextEffect = nextEffect.next;

  }
}

function commitLifeCycles(finishedRoot, current, finishedWork) {
  switch (finishedWork.tag) {
    case FComponent:
      commitWithEffectList(UnmountLayout, MountLayout, finishedWork);
      return;
    case Root:
      return
    case DNode:
      return;
    case Text:
      return;
    default:
      console.log('Error')
  }
}
