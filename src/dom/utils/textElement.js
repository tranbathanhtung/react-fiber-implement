import getDocumentByElement from './getDocumentByElement';
import { isTextNode } from './validate';

function resetTextContent(element) {
  setTextContent(element, '');
}

function setTextContent(node, text) {
  if (text) {
    let firstChild = node.firstChild;

    if (
      firstChild &&
      firstChild === node.lastChild &&
      isTextNode(firstChild)
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
}

function createTextNode(text, element) {
  const value = typeof text === 'object' ? JSON.stringify(text) : text;
  return getDocumentByElement(element).createTextNode(value);
}

export {
  createTextNode,
  setTextContent,
  resetTextContent,
}
