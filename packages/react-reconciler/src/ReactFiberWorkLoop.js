import { scheduleCallback } from "scheduler"
import { createWorkInProgress } from "./ReactFiber"

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
  // TODO: 到这里了
  const next = beginWork(current, unitOfWork)
}
