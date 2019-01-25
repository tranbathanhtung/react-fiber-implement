import { isCommentNode } from './validate';

function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

function appendChild(parent, child) {
  parent.appendChild(child);
}

function appendChildToContainer(
  container,
  child
) {
  let parentNode;
  if (isCommentNode(container)) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container)
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
}

export {
  appendChildToContainer,
  appendInitialChild,
  appendChild,
}
