import { setValueForStyle } from './CSSPropertyOperations'
import { setTextContent } from './setTextContent'
import { setValueForProperty } from './DOMPropertyOperations'

export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props)
}

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey]
      // style, children, ...
      if (propKey === 'style') {
        setValueForStyle(domElement, nextProp)
      } else if (propKey === 'children') {
        if (typeof nextProp === 'string' || typeof nextProp === 'number') {
          setTextContent(domElement, `${nextProp}`)
        }
      } else {
        setValueForProperty(domElement, propKey, nextProp)
      }
    }
  }
}

export function diffProperties(domElement, tag, lastProps, nextProps) {
  let updatePayload = null
  let propKey
  let styleName
  let styleUpdates = null

  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] === null
    ) {
      continue
    }

    if (propKey === 'style') {
      const lastStyle = lastProps[propKey]
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {}
          }
          styleUpdates[styleName] = ''
        }
      }
    } else {
      ;(updatePayload = updatePayload || []).push(propKey, null)
    }
  }

  for (propKey in nextProps) {
    const nextProp = nextProps[propKey]
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp === null && lastProp === null)
    ) {
      continue
    }

    if (propKey === 'style') {
      if (lastProp) {
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) styleUpdates = {}
            styleUpdates[styleName] = ''
          }
        }

        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) styleUpdates = {}
            styleUpdates[styleName] = nextProp[styleName]
          }
        }
      } else {
        styleUpdates = nextProp
      }
    } else if (propKey === 'children') {
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        ;(updatePayload = updatePayload || []).push(propKey, nextProp)
      }
    } else {
      ;(updatePayload = updatePayload || []).push(propKey, nextProp)
    }
  }

  if (styleUpdates) {
    ;(updatePayload = updatePayload || []).push('style', styleUpdates)
  }

  return updatePayload
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload)
}
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i]
    const propValue = updatePayload[i + 1]
    if (propKey === 'style') {
      setValueForStyle(domElement, propValue)
    } else if (propKey === 'children') {
      setTextContent(domElement, propValue)
    } else {
      setValueForProperty(domElement, propKey, propValue)
    }
  }
}
