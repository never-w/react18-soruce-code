import { FunctionComponent, HostComponent, HostRoot, HostText, IndeterminateComponent } from "./ReactWorkTags"
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber"
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue"
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig"
import { renderWithHooks } from "react-reconciler/src/ReactFiberHooks"

function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren)
  }
}

function updateHostRoot(current, workInProgress) {
  processUpdateQueue(workInProgress)
  const nextState = workInProgress.memoizedState
  const nextChildren = nextState.element
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress
  const nextProps = workInProgress.pendingProps
  let nextChildren = nextProps.children
  const isDirectTextChild = shouldSetTextContent(type, nextProps)
  if (isDirectTextChild) {
    nextChildren = null
  }
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps
  const value = renderWithHooks(current, workInProgress, Component, props)
  workInProgress.tag = FunctionComponent
  reconcileChildren(current, workInProgress, value)
  return workInProgress.child
}

export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type)
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent:
      return updateHostComponent(current, workInProgress)
    case HostText:
      return null
    default:
      return null
  }
}
