// Then it build a list of effects.
// This list will contain all the fibers from the work-in-progress sub-tree
// that have any effectTag
// (it also contains the fibers from the old sub-tree with the DELETION effectTag).
import {
  Root,
  DNode,
  Text,
  FComponent,
} from '../shared/tag';
import { Placement, Update } from '../shared/effect-tag';

import {
  getRootHostContainer,
  popHostContainer
} from './host-context'

import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from '../dom/config';

function markUpdate(WIP) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  WIP.effectTag |= Update;
}

export function updateHostContainer(WIP) {
  let portalOrRoot = WIP.instanceNode;
  let childrenUnchanged = WIP.firstEffect === null;
  if (childrenUnchanged) {

  } else {
    var container = portalOrRoot.containerInfo;
    // var newChildSet = createContainerChildSet(container);
    // If children might have changed, we have to add them all to the set.
    // appendAllChildrenToContainer(newChildSet, WIP);
    // portalOrRoot.pendingChildren = newChildSet;
    // Schedule an update on the container to swap out the container.
    // markUpdate(WIP);
    // finalizeContainerChildren(container, newChildSet);
  }

}

export function updateHostComponent(
  current,
  WIP,
  type,
  newProps,
  rootContainerInstance
) {
  // If we have an alternate, that means this is an update and we need to
  // schedule a side-effect to do the updates.
  const oldProps = current.prevProps;
  if (oldProps === newProps) {
    // In mutation mode, this is sufficient for a bailout because
    // we won't touch this node even if children changed.
    return;
  }

    // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them.
    // TODO: Split the update API as separate for the props vs. children.
    // Even better would be if children weren't special cased at all tho.
    const instance = WIP.instanceNode;
    // TODO: Experiencing an error where oldProps is null. Suggests a host
    // component is hitting the resume path. Figure out why. Possibly
    // related to `hidden`.
    const updatePayload = prepareUpdate(
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
    );
    // // TODO: Type this specific to this type of component.
    WIP.updateQueue = WIP;
    // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update. All the work is done in commitWork.
    if (updatePayload) {
      markUpdate(WIP);
    }

}

export function updateHostText(
  current,
  WIP,
  oldText,
  newText
) {
  if (oldText !== newText) {
      markUpdate(WIP);
  }
}

function appendAllChildren(
  parent,
  WIP
) {
  let node = WIP.child;
  while (node !== null) {
    if (node.tag === DNode || node.tag === Text) {
      appendInitialChild(parent, node.instanceNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === WIP) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === WIP) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

export function completeWork(
  current,
  WIP,
) {
  // after beginWork work we props is new props
  const newProps = WIP.props;
  switch (WIP.tag) {
    case Root: {
      popHostContainer(WIP);
      const fiberRoot = (WIP.instanceNode: FiberRoot);
      if (current === null || current.child === null) {
        WIP.effectTag &= ~Placement;
      }
      updateHostContainer(WIP);
      return null;
    }
    case FComponent: {
      return null;
    }
    case DNode: {
      const rootContainerInstance = getRootHostContainer();
      const type = WIP.type;
      if (current !== null && WIP.instanceNode !== null) {
        updateHostComponent(
          current,
          WIP,
          type,
          newProps,
          rootContainerInstance,
        );
      } else {
        if (!newProps) {
          break;
        }

        // const currentHostContext = getHostContext();
        const currentHostContext = {
          namespace: "http://www.w3.org/1999/xhtml"
        }
        // create instance of element or fiber.. instance will be like document.createElement('div')
        let instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          WIP,
        );
        appendAllChildren(instance, WIP);
        // this function to set property to element
        finalizeInitialChildren(instance, type, newProps, rootContainerInstance, currentHostContext);
        // and set state node
        WIP.instanceNode = instance;

      }
      return null;
    }
    case Text: {
      const newText = newProps;
      // that means it rendered
      if (current !== null && WIP.instanceNode !== null) {
        let oldText = current.prevProps;
        updateHostText(current, WIP, oldText, newText);
      } else {
        if (typeof newText !== 'string') {
          return null;
        }
        const rootContainerInstance = getRootHostContainer();
        WIP.instanceNode = createTextInstance(newText, rootContainerInstance, WIP);
      }
      return null;
    }
    default:
      return null;
  }
}
