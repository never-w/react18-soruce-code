import ReactSharedInternals from 'shared/ReactSharedInternals'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'
import { Passive as PassiveEffect } from './ReactFiberFlags'
import { HasEffect as HookHasEffect, Passive as HookPassive } from './ReactHookEffectTags'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'

let currentHook = null

const { ReactCurrentDispatcher } = ReactSharedInternals

let currentlyRenderingFiber = null
let workInProgressHook = null

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
}
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
}

function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps)
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  currentlyRenderingFiber.flags |= fiberFlags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps)
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  }
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue()
    currentlyRenderingFiber.updateQueue = componentUpdateQueue
    componentUpdateQueue.lastEffect = effect.next = effect
  } else {
    const lastEffect = componentUpdateQueue.lastEffect
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect
    } else {
      const firstEffect = lastEffect.next
      lastEffect.next = effect
      effect.next = firstEffect
      componentUpdateQueue.lastEffect = effect
    }
  }

  return effect
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  }
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

function baseStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action
}

function mountState(initialState) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialState
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer,
    lastRenderedState: initialState,
  }
  hook.queue = queue
  const dispatch = (queue.dispatch = dispatchSetStateAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ))

  return [hook.memoizedState, dispatch]
}

function dispatchSetStateAction(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  }
  const { lastRenderedReducer, lastRenderedState } = queue
  const eagerState = lastRenderedReducer(lastRenderedState, action)
  update.eagerState = eagerState
  update.hasEagerState = true
  if (Object.is(eagerState, lastRenderedState)) return
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root)
}

function updateState() {
  return updateReducer(baseStateReducer)
}

function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps)
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  let destroy
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps)
        return
      }
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps)
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return null
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) continue
    return false
  }
  return true
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
  workInProgress.updateQueue = null
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
