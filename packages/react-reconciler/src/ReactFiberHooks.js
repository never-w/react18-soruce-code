import ReactSharedInternals from 'shared/ReactSharedInternals'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'

const { ReactCurrentDispatcher } = ReactSharedInternals
let currentlyRenderingFiber = null
let workInProgressHook = null
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
  const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue)
  return [hook.memoizedState, dispatch]
}

function updateReducer(reducer) {}

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
  return children
}
