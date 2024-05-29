import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties'
import { IS_CAPTURE_PHASE } from '../EventSystemFlags'

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer,
) {
  const reactName = topLevelEventsToReactNames.get(domEventName)

  let SyntheticEventCtor
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent
      break
    default:
      break
  }

  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0
  const listeners = accumulateSinglePhaseListener(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase,
  )

  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget,
    )
    dispatchQueue.push({
      event,
      listeners,
    })
  }
}

export { registerSimpleEvents as registerEvents, extractEvents }
