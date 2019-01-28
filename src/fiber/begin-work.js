import type {FNode} from 'f-node';

import {Root, DNode, FComponent, Text, Fragment} from '../shared/tag';
import { isObject } from '../shared/validate';
import {PerformedWork} from '../shared/effect-tag';
import {reconcileChildren, cloneChildFNodes} from './children';
import {pushHostContainer} from './host-context';
import {prepareWithState, finishedWith} from './f-with';
import {updateRootRender} from './root-render';
import * as Status from '../shared/status-work';
import shallowEqual from '../shared/shallowEqual';

// test

export function saveProps(WIP: FNode, props: any): void {
  WIP.prevProps = props;
}

export function saveState(WIP: FNode, state: any): void {
  WIP.prevState = state;
}

function shouldSetTextContent(type, props) {
  return type === 'textarea' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    typeof props.dangerouslySetInnerHTML === 'object'
      && props.dangerouslySetInnerHTML !== null
      && typeof props.dangerouslySetInnerHTML.__html === 'string';
}

function pushHostRootContext(WIP: FNode): void {
  const root = WIP.instanceNode;
  pushHostContainer(WIP, root.containerInfo);
}

function updateRoot(current: FNode | null, WIP: FNode): FNode | null {
  pushHostRootContext(WIP);

  const rootRender = WIP.rootRender;
  const nextProps = WIP.props;
  const prevState = WIP.prevState;
  const prevChild = prevState !== null
    ? prevState.element
    : null;
  // processUpdateQueue(WIP, updateQueue, nextProps, null);
  updateRootRender(WIP, rootRender, nextProps, null)
  const nextState = WIP.prevState;
  const nextChildren = nextState.element;

  reconcileChildren(current, WIP, nextChildren);
  return WIP.child;
}

function updateDomNode(current: FNode | null, WIP: FNode): FNode | null {

  const type = WIP.type;
  const nextProps = WIP.props;
  const prevProps = current !== null
    ? current.prevProps
    : null;
  let nextChildren = nextProps.children;
  reconcileChildren(current, WIP, nextChildren);
  saveProps(WIP, nextProps);
  return WIP.child;
}

function updateFunctionComponent(current: FNode | null, WIP: FNode, status): FNode | null {
  const Component = WIP.type;
  const unresolvedProps = WIP.props;
  const nextProps = resolveDefaultProps(Component, unresolvedProps);
  if (current !== null && status === Status.NoWork) {
    const prevProps = current.prevProps;
    if (shallowEqual(prevProps, nextProps) && current.ref === WIP.ref) {
      cloneChildFNodes(current, WIP);
      return WIP.child;
    }
  }

  let nextChildren;
  prepareWithState(current, WIP);

  nextChildren = Component(nextProps);

  nextChildren = finishedWith(Component, nextProps, nextChildren);
  WIP.effectTag |= PerformedWork;
  reconcileChildren(current, WIP, nextChildren);
  return WIP.child;
}

function updateTextNode(current, WIP) {
  const nextProps = WIP.props;
  saveProps(WIP, nextProps);
  return null;
}

function updateFragment(current, WIP) {
  const nextChildren = WIP.props;
  reconcileChildren(current, WIP, nextChildren);
  return WIP.child;
}

function resolveDefaultProps(Component: Function, baseProps: any) {
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

/**
* @param {FNode} current
* @param {FNode} WIP
* @return {FNode | null}
*/

export function beginWork(current: FNode | null, WIP: FNode): FNode | null {
  const status = WIP.status;
  if (current !== null) {
    const oldProps = current.prevProps;
    const newProps = WIP.props;
    if (oldProps === newProps && WIP.status === Status.NoWork) {
      // we just push root to stack
      if (WIP.tag === Root) {
        pushHostRootContext(WIP);
      }
      // clone this fiber and return child
      cloneChildFNodes(current, WIP);
      return WIP.child;
    }
  }
  // reset WIP
  WIP.status = Status.NoWork;

  if (WIP.tag === Root) {
    return updateRoot(current, WIP);
  } else if (WIP.tag === DNode) {
    return updateDomNode(current, WIP);
  } else if (WIP.tag === FComponent) {
    return updateFunctionComponent(current, WIP, status)
  } else if (WIP.tag === Text) {
    return updateTextNode(current, WIP);
  } else if (WIP.tag === Fragment) {
    return updateFragment(current, WIP);
  } else
    return null;
}
