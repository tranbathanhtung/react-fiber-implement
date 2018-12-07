import {
  Root,
  DNode,
  FComponent,
  Text
} from '../shared/tag';
import { PerformedWork } from '../shared/effect-tag';
import { processUpdateQueue } from './queue';
import { reconcileChildren, cloneChildFNodes } from './children';
import { pushHostContainer } from './host-context';
import { prepareWithState, finishedWith } from './f-with';
import { updateRootRender } from './root-render';
import * as Status from '../shared/status-work';

export function saveProps(WIP, props) {
  WIP.prevProps = props;
}

export function saveState(WIP, state) {
  WIP.prevState = state;
}

function shouldSetTextContent(type, props) {
  return type === 'textarea' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && typeof props.dangerouslySetInnerHTML.__html === 'string';
}


function pushHostRootContext(WIP) {
  const root = WIP.instanceNode;
  pushHostContainer(WIP, root.containerInfo);
}

function updateRoot(current, WIP) {
  pushHostRootContext(WIP);

  const rootRender = WIP.rootRender;
  const nextProps = WIP.props;
  const prevState = WIP.prevState;
  const prevChild = prevState !== null ? prevState.element : null;
  // processUpdateQueue(WIP, updateQueue, nextProps, null);
  updateRootRender(WIP, rootRender, nextProps, null)
  const nextState = WIP.prevState;
  const nextChildren = nextState.element;

  reconcileChildren(current, WIP, nextChildren);
  return WIP.child;
}

function updateDomNode(current, WIP) {

  let type = WIP.type;
  let nextProps = WIP.props;
  let prevProps = current !== null ? current.prevProps : null;

  let nextChildren = nextProps.children;
  let isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
        // We special case a direct text child of a host node. This is a common
        // case. We won't handle it as a reified child. We will instead handle
        // this in the host environment that also have access to this prop. That
        // avoids allocating another HostText fiber and traversing it.
        nextChildren = null;
    } else if (prevProps && shouldSetTextContent(type, prevProps)) {
        // If we're switching from a direct text child to a normal child, or to
        // empty, we need to schedule the text content to be reset.
        // workInProgress.effectTag |= ContentReset;
    }
  reconcileChildren(current, WIP, nextChildren);
  saveProps(WIP, nextProps);
  return WIP.child;
}

function updateFunctionComponent(current, WIP, Component, nextProps) {
  let nextChildren;
  // console.log('Component', Component)
  // console.log('nextProps', nextProps)
  prepareWithState(current, WIP);

  nextChildren = Component(nextProps);

  nextChildren = finishedWith(Component, nextProps, nextChildren);
  // WIP.effectTag = PerformedWork;
  reconcileChildren(current, WIP, nextChildren);
  return WIP.child;
}

function updateTextNode(current, WIP) {
  let nextProps = WIP.props;
  saveProps(WIP, nextProps);
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (let propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

function bailoutOnAlreadyFinishedWork(
  current,
  WIP
) {
  // This fiber doesn't have work, but its subtree does. Clone the child
  // fibers and continue.
  cloneChildFNodes(current, WIP);
  return WIP.child;
}

export function beginWork(current, WIP) {
  if (current !== null) {
    const oldProps = current.prevProps;
    const newProps = WIP.props;
    console.log('oldProps === newProps', oldProps === newProps)
    console.log('WIP', WIP)
    if (
      oldProps === newProps &&
      WIP.status === Status.NoWork
    ) {
      // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.
      switch (WIP.tag) {
        case Root:
          pushHostRootContext(WIP);
          break;
        case DNode:
          break;
      }
      return bailoutOnAlreadyFinishedWork(current, WIP);
    }
    // current.status = Status.NoWork;
  }

  WIP.status = Status.NoWork;

  let child;
  switch (WIP.tag) {
    case Root:
      child = updateRoot(current, WIP);
      break;
    case DNode:
      child = updateDomNode(current, WIP);
      break;

    case FComponent: {
      const Component = WIP.type;
      const unresolvedProps = WIP.props;
      const resolvedProps =
        WIP.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      child = updateFunctionComponent(
        current,
        WIP,
        Component,
        resolvedProps,
      );
      break;

    }
    case Text:
      child = updateTextNode(current, WIP);
      break;

    default:
      throw new Error('Unknown tag');
      break;
  }

  return child
}
