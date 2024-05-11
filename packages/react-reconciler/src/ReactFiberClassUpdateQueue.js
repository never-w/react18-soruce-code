import { HostRoot } from "./ReactWorkTags"

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  const node = sourceFiber
  const parent = sourceFiber.return

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
