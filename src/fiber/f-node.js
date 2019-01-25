// @flow
import type { VNodeElement, Container } from '../shared/types';
import * as Tag from '../shared/tag';
import * as Status from '../shared/status-work';
import { isString, isFunction } from '../shared/validate';
import { LinkedList } from '../structures/linked-list';

export type FNode = {
  // tag is what we know what is this fiber like root, function component or text ...
  tag: number,
  key: string | null,
  // type of element like button, div
  elementType: string | null,
  // it like element type
  type: string | null,
  // instanceNode is dom element
  instanceNode: any,
  // parent of node
  return: FNode | null,
  // child of node
  child: FNode | null,
  // sibling of node
  sibling: FNode | null,
  // index is index of array children element
  // Eg: [f1, f2, f3] index of f2 is 1
  index: number,
  // props is pending props wait to work
  props: any,
  prevProps: any,
  prevState: any,
  // effect
  effectTag: number,
  nextEffect: FNode | null,
  lastEffect: FNode | null,
  firstEffect: FNode | null,
  // this to test linked list
  linkedList: any,
  // rootRender
  rootRender: any,
  // alternate
  alternate: FNode | null,
  // status to know this fiber need work or not
  status: number,
  // life cycle of this fiber
  lifeCycle: any,

}

export type FRoot = {
  current: FNode,
  containerInfo: any,
}

function FNode(
  tag: number,
  props: any,
  key: string | null
) {
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;

  this.instanceNode = null;
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.props = props;
  this.prevProps = null;
  this.prevState = null;

  this.effectTag = 0;
  this.nextEffect = null;
  this.firstEffect = null;
  this.lastEffect = null;
  this.linkedList = new LinkedList();
  this.next = null;

  this.rootRender = null;

  this.alternate = null;

  this.status = Status.Working;

  this.lifeCycle = null;
}

export function createFNode(tag: number, props: any, key: string | null): FNode {
  return new FNode(tag, props, key);
}

export function createFRoot(container: Container): FRoot {
  const current = new FNode(Tag.Root, null, null);
  const root = {
    current: current,
    containerInfo: container,
  }
  current.instanceNode = root;
  return root;
}

/**
 * @param {FNode} current is current fnode is displayed on screen
 * @param {any} props is nextProps of fiber
 * @return {FNode} new Fnode is next fiber to work is called work-in-progress
 */

export function createWIP(current: FNode, props: any): FNode {
  if (current === null) return;
  let WIP = current.alternate;
  if (WIP === null) {
    // if workInProgress === null we will start create a work-in-progress tree
    WIP = createFNode(current.tag, props, current.key);
    WIP.elementType = current.elementType;
    WIP.type = current.type;
    WIP.instanceNode = current.instanceNode;

    WIP.alternate = current;
    current.alternate = WIP;
  } else {
    // set props and reset effect tag
    WIP.props = props;
    WIP.effectTag = 0;

    // The effect list is no longer valid.
    WIP.nextEffect = null;
    WIP.firstEffect = null;
    WIP.lastEffect = null;
    WIP.linkedList = new LinkedList();;
    WIP.next = null;


  }
  WIP.child = current.child;

  WIP.prevProps = current.prevProps;
  WIP.prevState = current.prevState;
  WIP.rootRender = current.rootRender;


  WIP.sibling = current.sibling;
  WIP.index = current.index;

  WIP.status = current.status;

  WIP.lifeCycle = current.lifeCycle;

  return WIP;

};

/**
 * @param {Element} el is v-node
 * @return {FNode} new Fnode is created based on v-node element
*/

export function createFNodeFromElement(el: VNodeElement): FNode {
  if (el === null) return null;
  const { type = '', key = null, props = {} } = el;
  let fnode;
  if (isString(type)) {
    fnode = createFNode(Tag.DNode, props, key);
  } else if (isFunction(type)) {
    fnode = createFNode(Tag.FComponent, props, key);
  }
  if (fnode !== null) {
    fnode.elementType = type;
    fnode.type = type;
  }
  return fnode;
}

export function createFNodeFromFragment(elements, key) {
  const fnode = createFNode(Tag.Fragment, elements, key);
  return fnode;
}
