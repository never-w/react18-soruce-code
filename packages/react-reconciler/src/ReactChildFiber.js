import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber'
import { Placement, ChildDeletion } from './ReactFiberFlags'
import isArray from 'shared/isArray'
import { HostText } from './ReactWorkTags'

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

  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    newFiber.index = newIdx
    if (!shouldTrackSideEffects) return lastPlacedIndex
    const current = newFiber.alternate

    // 复用老fiber
    if (current !== null) {
      const oldIndex = current.index
      newFiber.flags |= Placement
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement
        return lastPlacedIndex
      } else {
        return oldIndex
      }
    } else {
      // 不是复用老fiber
      newFiber.flags |= Placement
      return lastPlacedIndex
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

  /**
   * 更新元素节点
   * @param {Object} returnFiber 父级fiber节点
   * @param {Object} current 当前fiber节点
   * @param {Object} element 新的React元素
   * @return {Object} 返回一个更新后的fiber节点
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type
    if (current !== null) {
      if (current.type === elementType) {
        const existing = useFiber(current, element.props)
        existing.return = returnFiber
        return existing
      }
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  /**
   * 更新一个slot，如果新的子节点和旧的fiber节点匹配，则返回更新后的fiber节点，否则返回null
   * @param {Object} returnFiber 父级fiber节点
   * @param {Object|null} oldFiber 旧的fiber节点
   * @param {any} newChild 新的子节点
   * @return {Object|null} 返回一个更新后的fiber节点，如果新的子节点和旧的fiber节点不匹配，则返回null
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null
    if (newChild !== null && typeof newChild === 'object') {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild)
          }
        default:
          return null
      }
    }

    return null
  }

  /**
   * 将剩余的子节点映射到一个Map对象中
   * @param {Object|null} returnFiber 父级fiber节点
   * @param {Object|null} existingChildren 已经存在的子节点
   * @return {Map|null} 返回一个Map对象，键是子节点的key，值是子节点的fiber节点
   */
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map()

    let existingChild = currentFirstChild
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild)
      } else {
        existingChildren.set(existingChild.index, existingChild)
      }
      existingChild = existingChild.sibling
    }

    return existingChildren
  }

  /**
   * 如果当前节点是文本节点则复用，否则创建新的文本节点。
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {Fiber} current - 当前处理的Fiber节点
   * @param {string} textContent - 文本内容
   * @returns {Fiber} 新的或者复用的文本节点
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent)
      created.return = returnFiber
      return created
    } else {
      const existing = useFiber(current, textContent)
      existing.return = returnFiber
      return existing
    }
  }

  /**
   * 从现有的子节点映射中更新Fiber节点
   * @param {Map} existingChildren - 现有的子节点映射
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {number} newIdx - 新节点的索引
   * @param {any} newChild - 新的子节点
   * @returns {Fiber} 更新后的Fiber节点
   */
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const matchedFiber = existingChildren.get(newIdx) || null
      return updateTextNode(returnFiber, matchedFiber, '' + newChild)
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null
          return updateElement(returnFiber, matchedFiber, newChild)
        }
      }
    }
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstChild - 老fiber第一个子fiber
   * @param {Array} newChildren - 新的子节点数组
   * @return {Fiber} resultingFirstChild - 返回的新的子Fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null
    let previousNewFiber = null
    let newIdx = 0
    let oldFiber = currentFirstChild
    let nextOldFiber = null
    let lastPlacedIndex = 0

    // 数组新虚拟DOM 第一套方案
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      nextOldFiber = oldFiber.sibling
      // 这里生成的新fiber可以是复用原来的老fiber，也可能是新创建的
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx])
      if (newFiber === null) break
      if (shouldTrackSideEffects) {
        //  复用才有 alternate，没有复用就是null（因为新创建的fiber没有 alternate 值）
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber)
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }

    // 数组新虚拟DOM 第二套方案
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx])
        if (newFiber === null) continue
        placeChild(newFiber, lastPlacedIndex, newIdx)
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
    }

    // 数组新虚拟DOM 第三套方案
    // https://vue3js.cn/interview/React/diff.html#%E4%BA%8C%E3%80%81%E5%8E%9F%E7%90%86
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber)
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
      )
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key)
          }
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)

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
    // 单节点 dom diff
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

    // 多节点 dom diff
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild)
    }

    return null
  }

  return reconcileChildFibers
}

export const reconcileChildFibers = createChildReconciler(true)
export const mountChildFibers = createChildReconciler(false)
