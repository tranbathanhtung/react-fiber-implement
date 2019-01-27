// @flow
import { isNil, isFunction } from '../shared/validate';
const hasOwnProperty = Object.prototype.hasOwnProperty;


const hasSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = hasSymbol
  ? Symbol.for('react.element')
  : 0xeac7;
export const REACT_FRAGMENT_TYPE = hasSymbol
  ? Symbol.for('react.fragment')
  : 0xeacb;

const RESERVED_PROPS = {
  key: true,
  ref: true,
};

function hasValidKey(options) {
  return options.key !== undefined;
}

function VNode(type, props, key) {
  const vnode = {
    $$typeof: REACT_ELEMENT_TYPE,

    type: type,
    props: props,
    key: key,
  }

  return vnode;
}

export function h(type, options, children) {
  let propName;
  const props = {};
  let key = null;
  if (!isNil(options)) {
    if (hasValidKey(options)) {
      key = '' + options.key;
    }
    for (propName in options) {
      // Why use hasOwnProperty.call instead of someObj.hasOwnProperty?
      // 1.hasOwnProperty is defined on the object as something else
      // 2.The object in question is being used as a map and doesn't inherit from Object.prototype, so it doesn't have hasOwnProperty:
      if (hasOwnProperty.call(options, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = options[propName];
      }
    }
  }
  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  // if createElement has 5 params number of children will be 3
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    // create Array empty has childrenLength element
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      // create array child
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return VNode(type, props, key);
}
