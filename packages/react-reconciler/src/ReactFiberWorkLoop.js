import { scheduleCallback } from "scheduler"
import { createWorkInProgress } from "./ReactFiber"
import { beginWork } from "./ReactFiberBeginWork"
import { completeWork } from "./ReactFiberCompleteWork"
import { MutationMask, NoFlags } from "./ReactFiberFlags"
import { commitMutationEffectsOnFiber } from "./ReactFiberCommitWork"

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
  commitRoot(root)
}

function renderRootSync(root) {
  prepareFreshStack(root)
  workLoopSync()
}

function commitRoot(root) {
  debugger
  const { finishedWork } = root
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root)
  }

  root.current = finishedWork
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

  // workInProgress = null
  if (next === null) {
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork
  do {
    const current = completedWork.alternate
    const returnFiber = completedWork.return
    completeWork(current, completedWork)
    const siblingFiber = completedWork.sibling
    if (siblingFiber !== null) {
      workInProgress = siblingFiber
      return
    }
    completedWork = returnFiber
    // 这里这样赋值是还要去看有没有兄弟节点
    workInProgress = completedWork
  } while (completedWork !== null)
}
