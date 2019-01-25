import { isDocumentNode } from './validate';

/**
* @param {HTMLElement} element
* @return {Document}
*/
function getDocumentByElement(element) {
  return isDocumentNode(element) ? element : element.ownerDocument;
}

export default getDocumentByElement;
