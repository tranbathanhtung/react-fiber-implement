import type { Fiber } from './Fiber';
import {
  createWIP,
  createFNodeFromElement,
  createFNode,
} from './f-node';
import {
  Root,
  DNode,
  FComponent,
  Text,
} from '../shared/Tag';
import { NoEffect, Placement, Deletion } from '../shared/effect-tag';

const isArray = Array.isArray;

function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFNode, childToDelete) {
    if (!shouldTrackSideEffects) {
      return;
    }

    const last = returnFNode.lastEffect;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFNode.lastEffect = childToDelete;
    } else {
      returnFNode.firstEffect = returnFNode.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }
  function deleteRemainingChildren(returnFNode, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      return null;
    }

    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFNode, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
  function placeChild(newFNode, lastPlacedIndex, newIndex) {
    newFNode.index = newIndex;
    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }

    const current = newFNode.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // this is a move
        newFNode.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // this item can stay in place
        return oldIndex;
      }
    } else {
      // this is an insertion.
      newFNode.effectTag = Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFNode) {
    console.log('placeChild',newFNode)

    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFNode.alternate === null) {
      newFNode.effectTag = Placement;
    }
    return newFNode;
  }

  function useFNode(fiber, props) {
    let clone = createWIP(fiber, props);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function createFNodeFromText(content) {
    let fiber = createFNode(Text, content, null)
    return fiber;
  }


  function createChild(
    returnFNode,
    newChild,
  ) {
      if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.
        const created = createFNodeFromText(
          '' + newChild,
        );
        created.return = returnFNode;
        return created;
      }

      if (typeof newChild === 'object' && newChild !== null) {
        if (newChild.$$typeof) {
          const created = createFNodeFromElement(newChild);
          created.return = returnFNode;
          return created;
        }
      }

      // if (isArray(newChild)) {
      //   const created = createFNodeFromFragment(
      //     newChild,
      //     newChild.key,
      //   );
      //   created.return = returnFNode;
      //   return created;
      // }
      return null;
  }

  function updateTextNode(returnFNode, current, textContent) {
    if (current !== null && current.tag !== Text) {
      // Insert
      const created = createFNodeFromText(textContent);
      created.return = returnFNode;
      return created
    } else {
      // Update
      const existing = useFNode(current, textContent);
      existing.return = returnFNode;
      return existing;
    }
  }

  function updateElement(
    returnFNode,
    current,
    element
  ) {
    if (current !== null && current.elementType === element.type) {
      // Move based on index
      const existing = useFNode(current, element.props);
      existing.return = returnFNode;
      return existing;
    } else {
      // Insert
      const created = createFNodeFromElement(
        element,
      );
      created.return = returnFNode;
      return created;
    }
  }

  function updateSlot(returnFNode, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }
      return updateTextNode(
        returnFNode,
        oldFiber,
        '' + newChild,
      );
    }

    if (typeof newChild === 'object' && newChild !== null) {
      if (newChild.key === key) {
        return updateElement(returnFNode, oldFiber, newChild);
      } else {
        return null;
      }
    }
    if (isArray(newChild)) {
      if (key !== null) {
          return null;
      }
      return null;
    }
    return null;
  }

  function mapRemainingChildren(returnFNode, currentFirstChild) {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    const existingChildren: Map<string | number, Fiber> = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
          if (existingChild.key !== null) {
            existingChildren.set(existingChild.key, existingChild);
          } else {
            existingChildren.set(existingChild.index, existingChild);
          }
          existingChild = existingChild.sibling;
        }
    return existingChildren;

  }

  function reconcileChildrenArray(returnFNode, currentFirstChild, newChildren) {

      let resultingFirstChild = null;
      let previousnewFNode = null;

      let oldFiber = currentFirstChild; // null
      let lastPlacedIndex = 0;
      let newIdx = 0;
      let nextOldFiber = null;

      for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }
        const newFNode = updateSlot(returnFNode, oldFiber, newChildren[newIdx]);
        if (newFNode === null) {
          // TODO: This breaks on empty slots like null children. That's
          // unfortunate because it triggers the slow path all the time. We need
          // a better way to communicate whether this was a miss or null,
          // boolean, undefined, etc.
          if (oldFiber === null) {
            oldFiber = nextOldFiber;
          }
          break;
        }
        lastPlacedIndex = placeChild(newFNode, lastPlacedIndex, newIdx);

        if (previousnewFNode === null) {
          resultingFirstChild = newFNode;
        } else {
          previousnewFNode.sibling = newFNode;
        }
        previousnewFNode = newFNode;
        oldFiber = nextOldFiber;
      }

      if (newIdx === newChildren.length) {
        // We've reached the end of the new children. We can delete the rest.
        deleteRemainingChildren(returnFNode, oldFiber);
        return resultingFirstChild;
      }

      if (oldFiber === null) {
        // If we don't have any more existing children we can choose a fast path
        // since the rest will all be insertions.
        for (; newIdx < newChildren.length; newIdx++) {
          const newFNode = createChild(
            returnFNode,
            newChildren[newIdx],
          );
          // if newFNode === null continue
          if (!newFNode) {
            continue;
          }
          lastPlacedIndex = placeChild(newFNode, lastPlacedIndex, newIdx);
          // we will set relation ship here
          if (previousnewFNode === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = newFNode;
          } else {
            previousnewFNode.sibling = newFNode;
          }
          previousnewFNode = newFNode
        }
        return resultingFirstChild;
      }
      // Add all children to a key map for quick lookups.
      const existingChildren = mapRemainingChildren(returnFNode, oldFiber);

      // Keep scanning and use the map to restore deleted items as moves.
      return resultingFirstChild;

  }

  function reconcileSingleTextNode(returnFNode, currentFirstChild, textContent) {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === Text) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFNode, currentFirstChild.sibling);
      var existing = useFNode(currentFirstChild, textContent);
      existing.return = returnFNode;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFNode, currentFirstChild);
    let created = createFNodeFromText(textContent);
    created.return = returnFNode;
    return created;
  }

  function reconcileSingleElement(returnFNode, currentFirstChild, el) {
    let key = el.key;
    let child = currentFirstChild;
    while (child !== null) {
      if (child.key === key) {
        if (child.type === el.type) {
          // if we had a child we use exactly it
          deleteRemainingChildren(returnFNode, child.sibling);
          let existing = useFNode(child, el.props);
          existing.return = returnFNode;
          return existing
        } else {
          deleteRemainingChildren(returnFNode, child);
          break;
        }
      }
      child = child.sibling;
    }
    // create a fiber from this child and set the parent
    const created = createFNodeFromElement(el);
    // created.ref = coerceRef(returnFNode, currentFirstChild, element);
    created.return = returnFNode;
    return created;
  }

  function reconcileChilds(returnFNode, currentFirstChild, newChild) {
    const isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      if (newChild.$$typeof) {
        // after find a child we will set effectTag is Placement ... it's mean we will create it
        return placeSingleChild(reconcileSingleElement(returnFNode, currentFirstChild, newChild));
      }
    }
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // after find a child we will set effectTag is Placement ... it's mean we will create it
      return placeSingleChild(reconcileSingleTextNode(returnFNode, currentFirstChild, '' + newChild));
    }
    if (isArray(newChild)) {
        return reconcileChildrenArray(returnFNode, currentFirstChild, newChild);
    }
    return deleteRemainingChildren(returnFNode, currentFirstChild);
  }

  return reconcileChilds;
}



export const reconcileChilds = ChildReconciler(true);
export const mountChilds = ChildReconciler(false);

export function cloneChildFNodes(
  current,
  WIP
) {
  if (WIP.child === null) {
    return;
  }
  let currentChild = WIP.child;
  let newChild = createWIP(currentChild, currentChild.props);
  WIP.child = newChild;

  newChild.return = WIP;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWIP(
      currentChild,
      currentChild.props
    );
    newChild.return = WIP;
  }
  newChild.sibling = null;
}

export function reconcileChildren(current, WIP, nextChild) {
  if (current === null) {
    WIP.child = mountChilds(WIP, null, nextChild);
  } else {
    WIP.child = reconcileChilds(WIP, current.child, nextChild);
  }
  // 
  // if (WIP.status !== 0) {
  //   console.log('WIP !== 0', WIP.child)
  // }


}
