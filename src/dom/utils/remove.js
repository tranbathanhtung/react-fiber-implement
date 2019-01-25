import { isCommentNode } from './validate';

export function removeChildFromContainer(container, child) {
  
  if (isCommentNode(container)) {
    container.parentNode.removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
