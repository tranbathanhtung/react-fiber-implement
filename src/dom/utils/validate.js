import { DOCUMENT_NODE, TEXT_NODE, COMMENT_NODE } from '../constants';

function isDocumentNode(el) {
  return el.nodeType === DOCUMENT_NODE;
}

function isTextNode(el) {
  return el.nodeType === TEXT_NODE;
}

function isCommentNode(el) {
  return el.nodeType === COMMENT_NODE;
}

export {
  isDocumentNode,
  isTextNode,
  isCommentNode,
};
