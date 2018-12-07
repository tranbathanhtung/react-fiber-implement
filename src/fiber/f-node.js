// @flow
import * as Tag from '../shared/tag';
import * as Status from '../shared/status-work';

function FNode(tag, props, key) {
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

  this.rootRender = null;

  this.alternate = null;

  this.status = Status.Working;

  this.lifeCycle = null;
}

export const createFNode = (tag, props, key) => new FNode(tag, props, key);

export const createFRoot = container =>  {
  const current = new FNode(Tag.Root, null, null);
  const root = {
    current: current,
    containerInfo: container,
  }
  current.instanceNode = root;
  return root;
}

export const createWIP = (current, props) => {
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
    // We already have an alternate.
    // Reset the effect tag.
    WIP.props = props;
    WIP.effectTag = 0;

    // The effect list is no longer valid.
    WIP.nextEffect = null;
    WIP.firstEffect = null;
    WIP.lastEffect = null;

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

export const createFNodeFromElement = el => {
  const type = el.type;
  const key = el.key;
  const props = el.props;
  let fnode;
  if (typeof type === 'string') {
    fnode = createFNode(Tag.DNode, props, key);
  } else if (typeof type === 'function') {
    fnode = createFNode(Tag.FComponent, props, key);
  }
  if (fnode !== null) {
    fnode.elementType = type;
    fnode.type = type;
  }
  return fnode;
}
