import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber'
import { Placement, ChildDeletion } from './ReactFiberFlags'
import isArray from 'shared/isArray'

function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 使用现有的fiber节点和待处理的props创建新的fiber节点
   * @param {Object} fiber 现有的fiber节点
   * @param {Object} pendingProps 待处理的props
   * @return {Object} clone 新的fiber节点
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
  }

  /**
   * 将子节点添加到待删除列表中
   * @param {Object} returnFiber 父级fiber节点
   * @param {Object} childToDelete 需要被删除的子fiber节点
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return
    const deletions = returnFiber.deletions
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      returnFiber.deletions.push(childToDelete)
    }
  }

  /**
   * 删除所有剩余的子节点
   * @param {Object} returnFiber 父级fiber节点
   * @param {Object} currentFirstChild 当前的第一个子节点
   * @return {null} 返回null
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return
    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
    return null
  }

  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 单节点 DOM DIFF
    const key = element.key
    let child = currentFirstChild
    while (child !== null) {
      if (child.key === key) {
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling)
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        } else {
          deleteRemainingChildren(returnFiber, child)
        }
      } else {
        deleteChild(returnFiber, child)
      }

      child = child.sibling
    }

    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement
    }
  }

  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`)
      created.return = returnFiber
      return created
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild)
          created.return = returnFiber
          return created
        default:
          break
      }
    }

    return null
  }

  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    let resultingFirstChild = null
    let previousNewFiber = null
    let newIdx = 0
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx])
      if (newFiber === null) continue

      placeChild(newFiber, newIdx)
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
    return resultingFirstChild
  }

  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement
    }
    return newFiber
  }

  function reconcileChildFibers(returnFiber, currentFirstFiber, newChild) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstFiber, newChild),
          )
        default:
          break
      }
    }
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild)
    }
    return null
  }

  return reconcileChildFibers
}

export const reconcileChildFibers = createChildReconciler(true)
export const mountChildFibers = createChildReconciler(false)
