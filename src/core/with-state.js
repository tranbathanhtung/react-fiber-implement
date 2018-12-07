import { withReducer } from '../fiber/f-with';

export function withState(initialState) {
  return withReducer(initialState);
}
