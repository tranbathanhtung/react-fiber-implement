let firstCallbackNode = null;

function flushFirstCallback() {
  let flushedNode = firstCallbackNode;

  let next = firstCallbackNode.next;
  if (firstCallbackNode === next) {
    // This is the last callback in the list.
    firstCallbackNode = null;
    next = null;
  } else {
    let lastCallbackNode = firstCallbackNode.previous;
    firstCallbackNode = lastCallbackNode.next = next;
    next.previous = lastCallbackNode;
  }
  flushedNode.next = flushedNode.previous = null;

  const callback = flushedNode.callback;
  let continuationCallback;

  continuationCallback = callback();

}


export function callLifeCycle(callback) {
  const newNode = {
    callback: callback,
    next: null,
    previous: null,
  }
  if (firstCallbackNode === null) {
    firstCallbackNode = newNode.next = newNode.previous = newNode;
    flushFirstCallback();
  } else {
    let next = null;
    let node = firstCallbackNode;

    do {
      next = node;
    } while (node !== firstCallbackNode);

    if (next === null) {
      next = firstCallbackNode;
    } else if (next === firstCallbackNode) {
      firstCallbackNode = newNode;
      flushFirstCallback();
    }

    let previous = next.previous;
    previous.next = next.previous = newNode;
    newNode.next = next;
    newNode.previous = previous;
  }

}
