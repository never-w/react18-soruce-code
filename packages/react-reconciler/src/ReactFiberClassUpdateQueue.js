import assign from "shared/assign"
import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates"

// 定义状态更新的类型标签
export const UpdateState = 0

/**
 * 初始化fiber节点的更新队列
 * @param {FiberNode} fiber - 需要初始化更新队列的fiber节点
 */
export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      pending: null, // 创建一个新的更新队列，其中pending是一个循环链表
    },
  }
  fiber.updateQueue = queue
}

/**
 * 创建一个状态更新对象
 * @returns {Update} 更新对象
 */
export function createUpdate() {
  const update = { tag: UpdateState }
  return update
}

/**
 * 将更新对象添加到fiber节点的更新队列中
 * @param {FiberNode} fiber - 需要添加更新的fiber节点
 * @param {Update} update - 待添加的更新对象
 * @returns {FiberNode} fiber根节点
 */
export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  const pending = updateQueue.shared.pending

  // 如果pending为空，则让update自引用形成一个循环链表
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }

  // pending始终指向最后一个更新对象，形成一个单向循环链表
  updateQueue.shared.pending = update

  return markUpdateLaneFromFiberToRoot(fiber)
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
  switch (update.tag) {
    case UpdateState:
      const { payload } = update
      // 合并prevState和payload为新状态
      return assign({}, prevState, payload)
  }
}
