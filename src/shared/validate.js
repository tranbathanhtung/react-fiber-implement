/** Check Array**/
const isArray = Array.isArray;
/** Check null**/
const isNil = value => typeof value === 'object' && value === null;
/** Check object**/
const isObject = value => typeof value === 'object' && value !== null && !isArray(value);
/** Check undefined**/
const isUndef = value => typeof value === 'undefined';
/** Check function**/
const isFunction = value => !isUndef(value) && typeof value === 'function';
/** Check number**/
const isNumber = value => Number.isInteger(value) && typeof value === "number";
/** Check string**/
const isString = value => typeof value === 'string';

export {
  isNil,
  isObject,
  isUndef,
  isFunction,
  isArray,
  isString,
  isNumber,
};
