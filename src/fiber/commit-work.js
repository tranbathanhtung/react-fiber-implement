import {
  resetTextContent,
  appendChild,
  appendChildToContainer,
  insertInContainerBefore,
  insertBefore,
  commitUpdate,
  commitTextUpdate,
} from '../dom/config';
import {
  Root,
  DNode,
  Text,
  FComponent
} from '../shared/tag';
import {
  ContentReset,
  Placement
} from '../shared/effect-tag';

function isHostParent(fiber) {
  return (
    fiber.tag === DNode ||
    fiber.tag === Root
  );
}

function getHostparentFNode(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function getHostSibling(fiber) {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (node.tag !== DNode && node.tag !== Text) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.effectTag & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.effectTag & Placement)) {
      // Found it!
      return node.instanceNode;
    }
  }
}

export function commitPlacement(finishedWork) {
  // Recursively insert all host nodes into the parent.
  const parentFNode = getHostparentFNode(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;

  switch (parentFNode.tag) {
    case DNode:
      parent = parentFNode.instanceNode;
      isContainer = false;
      break;
    case Root:
      parent = parentFNode.instanceNode.containerInfo;
      isContainer = true;
      break;
    default:
      console.log('Invalid host parent')

  }
  if (parentFNode.effectTag & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFNode.effectTag &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);
  let node = finishedWork;
  while (true) {
    if (node.tag === DNode || node.tag === Text) {
      if (before) {
        if (isContainer) {
          insertInContainerBefore(parent, node.instanceNode, before)
        } else {
          insertBefore(parent, node.instanceNode, before);
        }
      } else {
        if (isContainer) {
          appendChildToContainer(parent, node.instanceNode);
        } else {
          appendChild(parent, node.instanceNode);
        }
      }
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === finishedWork) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === finishedWork) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling
  }
}


export function commitWork(
  current,
  finishedWork,
) {
  switch (finishedWork.tag) {
    case FComponent:{
      return;
    }
    case DNode: {
      const instance = finishedWork.instanceNode;
      if (instance !== null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.prevProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldProps = current !== null ? current.prevProps : newProps;
        const type = finishedWork.type;
        // TODO: Type the updateQueue to be specific to host components.
        const updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    case Text: {
      const textInstance = finishedWork.instanceNode;
      const newText = finishedWork.prevProps;
      const oldText = current !== null ? current.prevProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case Root: {
      return;
    }
    default:
      console.error('Fuck up!!!')
  }
}

export function commitPassiveWithEffects(finishedWork) {
  commitWithEffectList(0, 64, finishedWork);
}

function commitWithEffectList(unmountTag, mountTag, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  console.log('lastEffect',lastEffect)

}
