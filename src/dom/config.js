import createElement from './utils/createElement';
import { createTextNode, setTextContent, resetTextContent } from './utils/textElement';
import { appendChildToContainer, appendInitialChild, appendChild } from './utils/append';
import { removeChildFromContainer, removeChild } from './utils/remove';
import { insertInContainerBefore, insertBefore } from './utils/insert';
import { isDocumentNode } from './utils/validate';

const CHILDREN = 'children';

// Assumes there is no parent namespace.

const randomKey = Math.floor((Math.random() * 100) + 1);

const internalInstanceKey = '__reactInternalInstance$' + randomKey;
const internalEventHandlersKey = '__reactEventHandlers$' + randomKey;

export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
export function getFiberCurrentPropsFromNode(node) {
  return node[internalEventHandlersKey] || null;
}

export function updateFiberProps(node, props) {
  node[internalEventHandlersKey] = props;
}

export function createDomNodeInstance(
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle) {
  let parentNamespace;
  parentNamespace = hostContext;
  const domElement = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

function ensureListeningTo(rootContainerElement, eventName, callback) {
  const isDocumentOrFragment = isDocumentNode(rootContainerElement);
  const dom = isDocumentOrFragment
      ? rootContainerElement.ownerDocument
      : rootContainerElement;
  dom.addEventListener('click', callback, false);
}

function setInitialDOMProperties(
  tag,
  domElement,
  rootContainerElement,
  nextProps,
  isCustomComponentTag
) {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        // Avoid setting initial textContent when the text is empty. In IE11 setting
        // textContent on a <textarea> will cause the placeholder to not
        // show within the <textarea> until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        const canSetTextContent = tag !== 'textarea' || nextProp !== '';
        if (canSetTextContent) {
          setTextContent(domElement, nextProp)
        }
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp)
      }
    } else if (propKey[0] === 'o' && propKey[1] === 'n') {
      ensureListeningTo(domElement, propKey, nextProp)
    }
  }
}

export function setInitialProperties(
  domElement,
  tag,
  rawProps,
  rootContainerElement,
) {
  let isCustomComponentTag = false;
  let props;
  switch (tag) {
    case 'iframe':
    default:
      props = rawProps;
  }

  // assertValidProps(tag, props);
  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag,
  );
}


export function finalizeInitialChildren(
  domElement,
  type,
  props,
  rootContainerInstance,
  hostContext
) {
  setInitialProperties(domElement, type, props, rootContainerInstance)
  return false
}

export function createTextInstance(
  text,
  rootContainerInstance,
  internalInstanceHandle
) {
  const textNode = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

function updateDOMProperties(
  domElement,
  updatePayload,
  wasCustomComponentTag,
  isCustomComponentTag
) {
  for (let i = 0; i < updatePayload.length; i++) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    }
  }
}

// Apply the diff
export function updateProperties(
  domElement,
  updatePayload,
  tag,
  lastRawProps,
  nextRawProps,
) {
  const wasCustomComponentTag = false;
  const isCustomComponentTag = false;
  // Apply the diff.
  updateDOMProperties(
    domElement,
    updatePayload,
    wasCustomComponentTag,
    isCustomComponentTag,
  )
}

export function commitUpdate(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps,
  internalInstanceHandle
) {
  // g('domElement', domElement)
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apple the diff to the DOM node
  updateProperties(domElement, updatePayload, type, oldProps, newProps);

}

export function commitTextUpdate(
  textInstance,
  oldText,
  newText,
) {
  textInstance.nodeValue = newText;
}

export function prepareUpdate(
  domElement,
  type,
  oldProps,
  newProps,
  rootContainerInstance,
) {
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
  )
}

function diffProperties(
  domElement,
  tag,
  lastRawProps,
  nextRawProps,
  rootContainerElement
) {
  let updatePayload = null;
  let lastProps = lastRawProps;
  let nextProps = nextRawProps;

  // it's like remove event listener because add event listener not orverride old function
  if (typeof lastProps.onClick === 'function' && typeof nextProps.onClick === 'function') {
    removeEvent(domElement, lastProps.onClick);
  }

  let propKey;

  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
      continue;
    }

    if (propKey === CHILDREN) {
      if (lastProp !== nextProp && (typeof nextProp === 'string' || typeof nextProp === 'number')) {
        (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
      }
    } else if (propKey[0] === 'o' && propKey[1] === 'n') {
      ensureListeningTo(domElement, propKey, nextProp)
      if (!updatePayload && lastProp !== nextProp) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" props pointer gets updated so we need a commit
        // to update this element.
        updatePayload = [];
      }
    } else {
      // For any other property we always add it to the queue and then we
      // filter it out using the whitelist during the commit.
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }

  return updatePayload;



}

function removeEvent(element, callback) {
  element.removeEventListener('click', callback);
}

export {
  createTextNode,
  setTextContent,
  resetTextContent,

  appendChildToContainer,
  appendInitialChild,
  appendChild,

  removeChildFromContainer,
  removeChild,

  insertInContainerBefore,
  insertBefore,
}
