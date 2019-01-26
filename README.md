## React fiber
react-fiber is my self study project help me understand how react work. In fact, all codebase re-implement each step , so it looks similar to the source code of react.Though, I think it's still smaller and easier to understand than when you actually read the react source code. I hope it helpful for people who want to start learn how react fiber work.

## Something you should read and learn before start read source code

#### Keyword, Algorithms and Data Structure Used
- Single linked list, Circular linked list
- Simple stack and queue
- Recursive
- Structural sharing
- [Reconciliation](https://reactjs.org/docs/reconciliation.html)
- Scheduler
- Bitwise Operators
- JSX
- DOM
###### And more
- [React Components, Elements, and Instances](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)
- [Design Principles](https://reactjs.org/docs/design-principles.html)
- [React Fiber resources](https://github.com/koba04/react-fiber-resources)
- [Inside Fiber: in-depth overview of the new reconciliation algorithm in React](https://medium.com/react-in-depth/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react-e1c04700ef6e)
- [The how and why on React’s usage of linked list in Fiber to walk the component’s tree](https://medium.com/react-in-depth/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-67f1014d0eb7)
- [In-depth explanation of state and props update in React
](https://medium.com/react-in-depth/in-depth-explanation-of-state-and-props-update-in-react-51ab94563311)
###### Recommend
- [Lin Clark - A Cartoon Intro to Fiber - React Conf 2017
](https://www.youtube.com/watch?v=ZCuYPiUIONs)
- [A look inside React Fiber
](https://makersden.io/blog/look-inside-fiber/)
- [Build your own React Fiber](https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec)
- [React Fiber Architecture @acdlite](https://github.com/acdlite/react-fiber-architecture) and [React Fiber Architecture @SaeedMalikx](https://github.com/SaeedMalikx/React-Fiber-Architecture)


## Overview

### Fiber tree

### Keyword
  ```
  work (unitOfWork): A component, node element => fiber

  current: Current fiber what is displayed on browser

  WIP (workInProgress): New fiber tree we will build

  fiber: {
    type: string | Function ('div', 'span', function Button)
    instanceNode: HTMLElement (div, span)
    return: fiber (parent of fiber)
    child: fiber (child of fiber)
    sibling: fiber (sibling of fiber)

    alternate: link current - WIP and WIP - current
    effectTag: number (give we know what will happen this fiber)

  }

  requestIdleCallback

  main function:
    createWorkInProgress()
    beginWork()
    reconcileChildren()
    completeWork()
    commitWork()
  ```

### Process of first render
  ```
  Render -> Reconciler -> Scheduler ->
  Begin Work (build fiber tree) -> ChildReconciler(create child and effectTag) -> if work has child we will continue to run beginWork -> no child ->              
  Complete Work (build list effect, mark tag and create instanceNode) -> sibling has child -> turn back Begin Work -> no child -> Complete Work -> no sibling -> has a new tree with effect tag ->
  Commit Work : It will base on list effect tag to commit each fiber (Placement, Update, Delete, Lifecycle)

  // In first render current fiber is null.
  // current is workInProgress when commit
  ```
### Process when update
  ```
  Do something ->
  Get current Fiber what corresponding to the component ->
  Recursive to find Root ->
  Clone fiber from root to component has update ->
  Begin Work from this fiber (it's maybe clone fiber when children of component use memo, pure component or use shouldComponentUpdate) ->
  Complete Work ->
  Commit Work
  ```

### About With(Hook v16.7)
  ```
  Hooks are stored as a linked list on the fiber's prevState field of fiber.
  current tree - current hook <=> WIP - WIP hook

  ```
