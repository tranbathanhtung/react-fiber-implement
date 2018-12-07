export function createRootRender(el) {
  const rootRender = {
    element: el,
  }
  return rootRender;
}


export function updateRootRender(WIP, rootRender) {
  let resultState;
  if (rootRender && rootRender.element) {
    resultState = rootRender;
  }
  WIP.prevState = resultState;
}
