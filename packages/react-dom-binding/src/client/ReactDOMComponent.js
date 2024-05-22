import { setValueForStyle } from "./CSSPropertyOperations"
import setTextContent from "./setTextContent"
import { setValueForProperty } from "./DOMPropertyOperations"

export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props)
}

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey]
      // style, children, ...
      if (propKey === "style") {
        setValueForStyle(domElement, nextProp)
      } else if (propKey === "children") {
        if (typeof nextProp === "string" || typeof nextProp === "number") {
          setTextContent(domElement, `${nextProp}`)
        }
      } else {
        setValueForProperty(domElement, propKey, nextProp)
      }
    }
  }
}
