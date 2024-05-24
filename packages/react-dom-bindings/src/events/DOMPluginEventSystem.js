import { allNativeEvents } from "./EventRegistry"
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin"
import { IS_CAPTURE_PHASE } from "./EventSystemFlags"
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener"
import { addEventCaptureListener, addEventBubbleListener } from "./EventListener"

SimpleEventPlugin.registerEvents()
const listeningMarker = `_reactListening${Math.random().toString(36).slice(2)}`

export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    allNativeEvents.forEach((domEventName) => {
      listenToNativeEvent(domEventName, true, rootContainerElement)
      listenToNativeEvent(domEventName, false, rootContainerElement)
    })
  }
}

export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener)
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
  const listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags)
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener)
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener)
  }
}
