import { HostRoot } from "./ReactWorkTags"
import { NoFlags } from "./ReactFiberFlags"

/**
 * 构造函数，用于创建一个新的Fiber节点
 * @param {number} tag - fiber的类型，如函数组件、类组件、原生组件、根元素等
 * @param {*} pendingProps - 新属性，等待处理或者说生效的属性
 * @param {*} key - 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag // 代表fiber节点的类型
  this.key = key
  this.type = null // 代表fiber节点对应虚拟DOM的类型
  this.stateNode = null
  this.return = null
  this.sibling = null
  this.pendingProps = pendingProps
  this.memoizedProps = null
  this.memoizedState = null
  this.updateQueue = null
  this.flags = NoFlags
  this.subtreeFlags = NoFlags
  this.alternate = null
  this.index = 0
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key)
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null)
}
