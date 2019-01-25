## React fiber
react-fiber is my self study project help me understand How react work. In fact, all codebase re-implement each step , so it looks similar to the codebase of react.Though, I think it's still smaller and easier to understand than when you actually read the react source code. I hope it helpful for people who want to start learn how react fiber work.

## Something you should read and learn before start read source code

#### Keyword, Algorithms and Data Structure Used
- Single linked list, Circular linked list
- Simple stack and queue
- Recursive
- Structural sharing
- [Reconciliation](https://reactjs.org/docs/reconciliation.html)
- Scheduler (requestIdleCallback)
- Bitwise Operators
- JSX
###### And more
- [React Components, Elements, and Instances](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)
- [Design Principles](https://reactjs.org/docs/design-principles.html)
- [React Fiber Architecture @acdlite](https://github.com/acdlite/react-fiber-architecture) and [React Fiber Architecture @SaeedMalikx](https://github.com/SaeedMalikx/React-Fiber-Architecture)
- [React Fiber resources](https://github.com/koba04/react-fiber-resources) (many Slides, Articles and Videos about fiber)
- [Inside Fiber: in-depth overview of the new reconciliation algorithm in React](https://medium.com/react-in-depth/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react-e1c04700ef6e)
- [The how and why on React’s usage of linked list in Fiber to walk the component’s tree](https://medium.com/react-in-depth/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-67f1014d0eb7)
- [In-depth explanation of state and props update in React
](https://medium.com/react-in-depth/in-depth-explanation-of-state-and-props-update-in-react-51ab94563311)
- [A look inside React Fiber
](https://makersden.io/blog/look-inside-fiber/) (recommend this Article)


## Overview
### First render
  Render ->
  Reconciler ->
  Scheduler ->
  Begin Work (find and create child) -> no child ->               
  Complete Work (find and create sibling ) -> sibling has child -> turn back Begin Work
  -> no child -> no work -> has a new tree with effect tag
  Commit Work : It will base on effect tag to commit each fiber (Placement, Update, Delete, Lifecycle ... this step will work with dom (/dom/config))

### When Update
  Do something ->
  Get current Fiber what corresponding to the component ->
  Recursive to find Root ->
  Clone fiber from root to component has update ->
  Begin Work from this fiber (it's maybe clone fiber when children of component use memo, pure component or use shouldComponentUpdate) ->
  Complete Work ->
  Commit Work
