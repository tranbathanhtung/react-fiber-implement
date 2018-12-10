import {
  Root
} from '../shared/tag';
import { Incomplete, NoEffect, PerformedWork, Placement, Update, Passive, PlacementAndUpdate } from '../shared/effect-tag';
import { createWIP } from './f-node';
import { beginWork } from './begin-work';
import { completeWork } from './complete-work';
import { commitPlacement, commitWork, commitPassiveWithEffects } from './commit-work';
import { resetWiths } from './f-with';
const expireTime = 1;

let nextUnitOfWork = null;
let nextEffect = null;

export function scheduleWork(fnode) {
  const root = getRootFromFnode(fnode);
  if (root === null) {
    // clone here
    return;
  }
  resetWiths();
  requestIdleCallback(dl => performWork(dl, root))
}

function getRootFromFnode(fnode) {
  // let alternate = fnode.alternate;
  // Walk the parent path to the root and update the child expiration time.
  let node = fnode.return;
  let root = null;
  if (root === null && fnode.tag === Root) {
    root = fnode.instanceNode;
  } else {
    while (node !== null) {
      // alternate = node.alternate;
      if (node.return === null && node.tag === Root) {
        root = node.instanceNode;
        break;
      }
      node = node.return;
    }
  }

  return root;
}

function performWork(dl, root) {
  workLoop(dl, root);
  if (nextUnitOfWork) {
    requestIdleCallback(dl => performWork(dl, root));
  }
  if (nextUnitOfWork === null) {
    let finishedWork = root.current.alternate;
    if (finishedWork) {
      // complete Root
      console.log('completeRoot', {root, finishedWork})
      completeRoot(root, finishedWork)
    }
  }
}

function workLoop(dl, root) {
  if (!nextUnitOfWork) {
    nextUnitOfWork = createWIP(root.current, null);
  }
  while (nextUnitOfWork !== null && dl.timeRemaining() > expireTime) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function performUnitOfWork(WIP) {
  const current = WIP.alternate;
  let next;

  next = beginWork(current, WIP);
  // console.log('next begin', next)
  WIP.prevProps = WIP.props;
  if (next === null) {
    next = completeUnitOfWork(WIP);
    // console.log('next complete', next)

  }

  return next;
}

function completeUnitOfWork(WIP) {
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

          // Append all the effects of the subtree and this fiber onto the effect
          // list of the parent. The completion order of the children affects the
          // side-effect order.
          if (returnFNode.firstEffect === null) {
            returnFNode.firstEffect = WIP.firstEffect;
          }

          if (WIP.lastEffect !== null) {
            if (returnFNode.lastEffect !== null) {
              returnFNode.lastEffect.nextEffect = WIP.firstEffect;
            }
            returnFNode.lastEffect = WIP.lastEffect;

          }

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
            if (returnFNode.lastEffect !== null) {
              returnFNode.lastEffect.nextEffect = WIP;
            } else {
              returnFNode.firstEffect = WIP;
            }
            returnFNode.lastEffect = WIP;
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
  root,
  finishedWork,
) {
  // Commit the root.
  root.finishedWork = null;
  commitRoot(root, finishedWork);
}

export function commitRoot(root, finishedWork) {
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if
    // it had one; that is, all the effects in the tree including the root.
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect;
  }

  nextEffect = firstEffect;
  while (nextEffect !== null) {
    commitAllHostEffects()
    if (nextEffect !== null) {
        nextEffect = nextEffect.nextEffect;
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

  //commitAllLifeCircleHere

  // This commit included a passive effect. These do not need to fire until
  // after the next paint. Schedule an callback to fire them in an async
  // event. To ensure serial execution, the callback will be flushed early if
  // we enter rootWithPendingPassiveEffects commit phase before then.
  if(
    firstEffect !== null
  ) {
    let callback = commitPassiveEffects.bind(null, root, firstEffect);
  }
}

function commitPassiveEffects(root, firstEffect) {
  let effect = firstEffect;
  do {
    if (effect.effectTag & Passive) {
      try {
        commitPassiveWithEffects(effect);
      } catch(err) {
        console.log(err)
      }
    }
    effect = effect.nextEffect;

  } while(effect !== null)
}

function commitAllHostEffects() {

  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    console.log('effectTag', nextEffect)
    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every
    // possible bitmap value, we remove the secondary effects from the
    // effect tag and switch on that value.
    let primaryEffectTag = effectTag & (Placement | Update);
    console.log('primaryEffectTag', primaryEffectTag)
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
        console.log('Place and Update');
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
      default:
        break;
    }
    nextEffect = nextEffect.nextEffect;
  }
}
