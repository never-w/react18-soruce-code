import ReactCurrentDispatcher from './ReactCurrentDispatcher'

function resolveDispatcher() {
  return ReactCurrentDispatcher.current
}

export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useReducer(reducer, initialArg)
}

export function useState(initialArg) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialArg)
}

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(create, deps)
}

export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useLayoutEffect(create, deps)
}
