import { scheduleCallback } from 'scheduler'
import { createWorkInProgress } from './ReactFiber'

let workInProgress = null

export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root) {
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root))
}

function performConcurrentWorkOnRoot(root) {
  renderRootSync(root)
  root.finishedWork = root.current.alternate
  //   commitRoot(root)
}

function renderRootSync(root) {
  prepareFreshStack(root)
  workLoopSync()
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  const next = beginWork(current, unitOfWork)
  // 这里为什么将 pendingProps 赋值给 memoizedProps 因为，beginWork 里面处理过了 pendingProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps

  // TODO: 临时写一个 null，因为还没具体实现逻辑，防止死循环
  workInProgress = null
  if (next === null) {
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}

function completeUnitOfWork(unitOfWork) {
  console.log(unitOfWork, 'completeUnitOfWork阶段')
}
