export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  const listenerWrapper = dispatchDiscreteEvent
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer)
}

// nativeEvent 这是事件注册原生提供的
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {}
