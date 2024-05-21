import { HostRoot } from "./ReactWorkTags"
import assign from "shared/assign"

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber
  let parent = sourceFiber.return

  while (parent !== null) {
    node = parent
    parent = parent.return
  }

  if (node.tag === HostRoot) {
    // 返回整个应用程序的FiberRoot
    return node.stateNode
  }
  return null
}

export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue
  const pendingQueue = queue.shared.pending
  if (pendingQueue !== null) {
    queue.shared.pending = null
    const lastPendingUpdate = pendingQueue
    const firstPendingUpdate = lastPendingUpdate.next

    lastPendingUpdate.next = null
    let newState = workInProgress.memoizedState
    let update = firstPendingUpdate
    while (update) {
      newState = getStateFromUpdate(update, newState)
      update = update.next
    }
    workInProgress.memoizedState = newState
  }
}

function getStateFromUpdate(update, prevState) {
  const { payload } = update
  return assign({}, prevState, payload)
}
