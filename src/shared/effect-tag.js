const NoEffect = 0;
const PerformedWork = 1;
const Placement = 2;
const Update = 4;
const PlacementAndUpdate = 6;
const Deletion = 5;

const Incomplete = 0b010000000000;
const ContentReset = 11;
const Passive = 0b001000000000;

export {
  NoEffect,
  PerformedWork,
  Placement,
  Update,
  PlacementAndUpdate,
  Deletion,

  Incomplete,
  ContentReset ,

}
