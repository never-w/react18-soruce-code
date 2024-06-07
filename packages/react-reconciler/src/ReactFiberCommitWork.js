import { MutationMask, Placement, Update, Passive, LayoutMask } from './ReactFiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import {
  appendInitialChild,
  insertBefore,
  commitUpdate,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from './ReactHookEffectTags'

// commitPassiveUnmountEffects
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork)
}

function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      if (flags & Passive) {
        commitHookPassiveUnmountEffects(finishedWork, HookHasEffect | HookPassive)
      }
      break
    }
  }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child !== null) {
      commitPassiveUnmountOnFiber(child)
      child = child.sibling
    }
  }
}

function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork)
}

function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy
        if (destroy !== undefined) {
          destroy()
        }
      }
      effect = effect.next
    } while (effect !== firstEffect)
  }
}

// commitPassiveMountEffects
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork)
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      if (flags & Passive) {
        commitHookPassiveMountEffects(finishedWork, HookHasEffect | HookPassive)
      }
      break
    }
  }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child !== null) {
      commitPassiveMountOnFiber(root, child)
      child = child.sibling
    }
  }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if ((effect.tag & flags) === flags) {
        const create = effect.create
        effect.destroy = create()
      }
      effect = effect.next
    } while (effect !== firstEffect)
  }
}

function recursivelyTraverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root)
      child = child.sibling
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork
  if (flags & Placement) {
    commitPlacement(finishedWork)
  }
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot
}

function getHostParentFiber(fiber) {
  let parent = fiber.return
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }
}

function getHostSibling(fiber) {
  let node = fiber
  sibling: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }
    node = node.sibling
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        continue sibling
      } else {
        node = node.child
      }
    }

    if (!(node.flags & Placement)) {
      return node.stateNode
    }
  }
}

function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node
  const isHost = tag === HostComponent || tag === HostText
  if (isHost) {
    const { stateNode } = node
    if (before) {
      insertBefore(parent, stateNode, before)
    } else {
      appendInitialChild(parent, stateNode)
    }
  } else {
    const { child } = node
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent)
      let { sibling } = child
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent)
        sibling = sibling.sibling
      }
    }
  }
}

function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork)
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo
      const before = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    case HostComponent:
      const parent = parentFiber.stateNode
      const before = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    default:
      break
  }
}

export function commitMutationEffectsOnFiber(finishedWork, root) {
  const flags = finishedWork.flags
  const current = finishedWork.alternate

  switch (finishedWork.tag) {
    case FunctionComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork)
      }
      break
    }
    case HostRoot:
    case HostText: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      break
    }
    case HostComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      if (flags & Update) {
        const instance = finishedWork.stateNode
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps
          const oldProps = current !== null ? current.memoizedProps : newProps
          const type = finishedWork.type
          const updatePayload = finishedWork.updateQueue
          finishedWork.updateQueue = null
          if (updatePayload) {
            commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork)
          }
        }
      }
    }
  }
}

// useLayoutEffect
export function commitLayoutEffects(finishedWork, root) {
  const current = finishedWork.alternate
  commitLayoutEffectOnFiber(root, current, finishedWork)
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork)
      if (flags & LayoutMask) {
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout)
      }
      break
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child
    while (child !== null) {
      const current = child.alternate
      commitLayoutEffectOnFiber(root, current, child)
      child = child.sibling
    }
  }
}
