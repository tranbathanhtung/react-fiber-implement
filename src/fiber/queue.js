// export const UpdateState = 0;
//
// export const createUpdate = () => {
//   const update = {
//     tag: UpdateState,
//     payload: null,
//     next: null,
//     nextEffect: null,
//   }
//   return update;
// }
//
// class Queue {
//   constructor(state) {
//     this.baseState = state;
//     this.firstUpdate = null;
//     this.lastUpdate = null
//   }
//
//   clone(queue) {
//     return new Queue(queue.baseState);
//   }
//
//   append(update) {
//     if (!this.lastUpdate) {
//       this.firstUpdate = this.lastUpdate = update;
//     } else {
//       this.lastUpdate.next = update;
//       this.lastUpdate = update;
//     }
//   }
// }
//
// export const enqueueUpdate = (fnode, update) => {
//   let queue = fnode.updateQueue;
//   if (queue === null) {
//     queue = fnode.updateQueue = new Queue(fnode.prevState);
//   }
//   if (queue !== null) {
//     queue.append(update);
//   }
// }
//
// const getStateFromUpdate = (WIP, queue, update, prevState, nextProps, instance) => {
//   switch (update.tag) {
//     case UpdateState:
//       const payload = update.payload;
//       let nextState;
//       if (typeof payload === 'function') {
//         nextState = payload.call(instance, prevState, nextProps);
//       } else {
//         nextState = payload;
//       }
//       if (nextState === null || nextState === undefined) {
//         return prevState;
//       }
//       // merge
//       return Object.assign({}, prevState, nextState);
//     default:
//       return prevState;
//   }
// }
//
// export const processUpdateQueue = (WIP, queue, props, instance) => {
//   let newBaseState = queue.baseState;
//   let newFirstUpdate = null;
//
//   let update = queue.firstUpdate;
//   let resultState = newBaseState;
//
//   while (update) {
//     g('update', update)
//     resultState = getStateFromUpdate(WIP, queue, update, resultState, props, instance);
//     update = update.next;
//   }
//   if (newFirstUpdate === null) {
//     queue.lastUpdate = null;
//     newBaseState = resultState;
//   }
//   queue.baseState = newBaseState;
//   queue.firstUpdate = newFirstUpdate;
//   WIP.prevState = resultState;
//
// }
