import getDocumentByElement from './getDocumentByElement';

/**
* @param {string} type
* @param {object} props
* @param {HTMLElement} rootContainerElement
* @param {string} parentNamespace
* @return {HTMLElement}
*/
function createElement(type, props, rootContainerElement, parentNamespace) {
  const ownerDocument = getDocumentByElement(rootContainerElement);
  let element;
  if (typeof props.is === 'string') {
    element = ownerDocument.createElement(type, {is: props.is});
  } else {
    element = ownerDocument.createElement(type);
    if (type === 'select' && props.multiple) {
      const node = element;
      node.multiple = true;
    }
  }
  return element;

}

export default createElement;
