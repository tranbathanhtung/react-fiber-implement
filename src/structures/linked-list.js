export function LinkedList() {
  this.first = null;
  this.last = null;
  return this;
}

LinkedList.prototype.add = function (node) {
  if (this.last === null) {
    this.last = node;
    this.first = node;
    return;
  }
  this.last.next = node;
  this.last = node;
};

// custom single linked-list add node
LinkedList.prototype.addEffectToParent = function (node) {
  if (this.first === null) {
    this.first = node.linkedList.first;
  }

  if (node.linkedList.last !== null) {
    if (this.last !== null) {
      this.last.next = node.linkedList.first;
    }
    this.last = node.linkedList.last;
  }
};
