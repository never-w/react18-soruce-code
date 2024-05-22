import { NoFlags } from "./ReactFiberFlags"
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags"
import { createTextInstance, createInstance, appendInitialChild, finalizeInitialChildren } from "react-dom-binding/src/client/ReactDOMHostConfig"

function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode)
    } else if (node.child !== null) {
      node = node.child
      continue
    }

    if (node === workInProgress) {
      return
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return
      }
      node = node.return
    }

    node = node.sibling
  }
}

export function completedWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps
  switch (workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress)
      break
    case HostComponent:
      const { type } = workInProgress
      const instance = createInstance(type, newProps, workInProgress)
      appendAllChildren(instance, workInProgress)
      workInProgress.stateNode = instance
      finalizeInitialChildren(instance, type, newProps)
      bubbleProperties(workInProgress)
      break
    case HostText:
      const newText = newProps
      workInProgress.stateNode = createTextInstance(newText)
      bubbleProperties(workInProgress)
      break
  }
}

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags
  let child = completedWork.child
  while (child) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags
    child = child.sibling
  }
  completedWork.subtreeFlags = subtreeFlags
}
