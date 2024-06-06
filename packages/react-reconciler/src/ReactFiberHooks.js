import ReactSharedInternals from 'shared/ReactSharedInternals'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'

const { ReactCurrentDispatcher } = ReactSharedInternals
let currentlyRenderingFiber = null
let workInProgressHook = null
let currentHook = null
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
}
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialArg
  const queue = {
    pending: null,
  }
  hook.queue = queue
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ))
  return [hook.memoizedState, dispatch]
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook()
  const queue = hook.queue
  const current = currentHook
  const pendingQueue = queue.pending
  let newState = current.memoizedState

  if (pendingQueue !== null) {
    queue.pending = null
    const firstUpdate = pendingQueue.next
    let update = firstUpdate
    do {
      const action = update.action
      newState = reducer(newState, action)
      update = update.next
    } while (update !== null && update !== firstUpdate)
  }

  hook.memoizedState = newState
  return [hook.memoizedState, queue.dispatch]
}

function dispatchReducerAction(fiber, queue, action) {
  const update = {
    action,
    next: null,
  }
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root)
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    queue: null,
    next: null,
  }

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    workInProgressHook = workInProgressHook.next = hook
  }

  return workInProgressHook
}

function updateWorkInProgressHook() {
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate
    currentHook = current.memoizedState
  } else {
    currentHook = currentHook.next
  }

  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  }

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
  } else {
    workInProgressHook = workInProgressHook.next = newHook
  }

  return workInProgressHook
}

export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount
  }
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  return children
}
