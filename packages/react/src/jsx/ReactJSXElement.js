import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols"
import hasOwnProperty from "shared/hasOwnProperty"

// 定义一些在React元素中保留的属性
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
}

// 检查config对象中是否有ref属性
function hasValidRef(config) {
  return config.ref !== undefined
}
// 检查config对象中是否有key属性
function hasValidKey(config) {
  return config.key !== undefined
}

// 创建一个React元素（虚拟DOM）
function ReactElement(type, key, ref, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  }
}

export function jsxDEV(type, config, maybekey) {
  const props = {}
  let key = null
  let ref = null

  if (typeof maybekey !== "undefined") {
    key = maybekey
  }

  if (hasValidKey(config)) {
    key = "" + config.key
  }
  if (hasValidRef(config)) {
    ref = config.ref
  }

  for (const propName in config) {
    if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName]
    }
  }

  return ReactElement(type, key, ref, props)
}
