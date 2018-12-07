import {
  createContainer,
  updateContainer
} from '../fiber/reconciler';

class Root {
  constructor(container) {
    const root = createContainer(container);
    this._root = root;
  }

  render(el) {
    updateContainer(el, this._root);
  }
}

export function render(el, container) {
  let root = container._rootContainer;
  if (!root) {
    root = container._rootContainer = new Root(container);
    root.render(el);
  }

}
