import getEventTarget from './getEventTarget'
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree'
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem'

export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags,
) {
  const listenerWrapper = dispatchDiscreteEvent
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer)
}

// nativeEvent 这是事件注册原生提供的
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
}

export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent,
) {
  const nativeEventTarget = getEventTarget(nativeEvent)
  const targetInst = getClosestInstanceFromNode(nativeEventTarget)

  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer,
  )
}
