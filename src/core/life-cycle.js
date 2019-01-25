import { withLifeCycle } from '../fiber/f-with';
import {
  Update as UpdateEffect,
  Passive
} from '../shared/effect-tag';
import {
  NoEffect as NoHookEffect,
  UnmountSnapshot,
  UnmountMutation,
  MountMutation,
  MountLayout,
  UnmountPassive,
  MountPassive,
} from '../shared/with-effect';

export const lifeCycle = ({mounted, destroyed, updated}) => {
  return withLifeCycle(UpdateEffect | Passive, UnmountPassive | MountPassive, {mounted, destroyed, updated});
}
