const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const Namespaces = {
  html: HTML_NAMESPACE,
  mathml: MATH_NAMESPACE,
  svg: SVG_NAMESPACE,
};
export const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const TEXT_NODE = 3;
const CHILDREN = 'children';

// Assumes there is no parent namespace.
export function getIntrinsicNamespace(type: string): string {
  switch (type) {
    case 'svg':
      return SVG_NAMESPACE;
    case 'math':
      return MATH_NAMESPACE;
    default:
      return HTML_NAMESPACE;
  }
}

function getOwnerDocumentFromRootContainer(
  rootContainerElement
) {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}

function createElement(
  type,
  props,
  rootContainerElement,
  parentNamespace,
) {
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerElement,
  );
  let domElement;
  let namespaceURI = parentNamespace;
  if (typeof props.is === 'string') {
    domElement = ownerDocument.createElement(type, {is: props.is});
  } else {
    domElement = ownerDocument.createElement(type);
    if (type === 'select' && props.multiple) {
      const node = domElement;
      node.multiple = true;
    }
  }

  return domElement;

}
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

export function createInstance(
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

export function appendInitialChild(
  parentInstance,
  child,
) {
  parentInstance.appendChild(child);
}

export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, '');
}

function setTextContent(node, text) {
  if (text) {
    let firstChild = node.firstChild;

    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === TEXT_NODE
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
}

function ensureListeningTo(rootContainerElement, eventName, callback) {
  const isDocumentOrFragment =
    rootContainerElement.nodeType === DOCUMENT_NODE;
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

// Append child
export function appendChildToContainer(
  container,
  child
) {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container)
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
}

export function appendChild(
  parentInstance,
  child,
) {
  parentInstance.appendChild(child);
}

export function insertBefore(
  parentInstance,
  child,
  beforeChild,
) {
  parentInstance.insertBefore(child, beforeChild);
}

export function createTextNode(
  text,
  rootContainerElement
) {
  return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(
    text,
  );
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

export function insertInContainerBefore(
  container,
  child,
  beforeChild,
) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
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
    trapClickOnNonInteractiveElement(domElement, lastProps.onClick);
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
      // console.log('add event', {domElement, propKey, nextProp})
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

function trapClickOnNonInteractiveElement(element, callback) {
  element.removeEventListener('click', callback);
}
