import { scheduleCallback } from 'scheduler'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'
import { MutationMask, NoFlags, Passive } from './ReactFiberFlags'
import {
  commitMutationEffectsOnFiber,
  commitPassiveUnmountEffects,
  commitPassiveMountEffects,
  commitLayoutEffects,
} from './ReactFiberCommitWork'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'

let workInProgress = null
let rootDoseHavePassiveEffect = false
let rootWithPendingPassiveEffects = null

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
  const { finishedWork } = root

  if ((finishedWork.subtreeFlags & Passive) !== NoFlags || finishedWork.flags & Passive) {
    if (!rootDoseHavePassiveEffect) {
      rootDoseHavePassiveEffect = true
      scheduleCallback(flushPassiveEffect)
    }
  }

  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root)
    commitLayoutEffects(finishedWork, root)
    if (rootDoseHavePassiveEffect) {
      rootDoseHavePassiveEffect = false
      rootWithPendingPassiveEffects = root
    }
  }

  root.current = finishedWork
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects
    commitPassiveUnmountEffects(root.current)
    commitPassiveMountEffects(root, root.current)
  }
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
  finishQueueingConcurrentUpdates()
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
