import { isCommentNode } from './validate';

function insertBefore(parent, child, beforeChild) {
  parent.insertBefore(child, beforeChild);
}

function insertInContainerBefore(container, child, beforeChild) {
  if (isCommentNode(container)) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

export {
  insertInContainerBefore,
  insertBefore
}
