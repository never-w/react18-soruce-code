import { createHostRootFiber } from "./ReactFiber"
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue"

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  const uninitailizedFiber = createHostRootFiber()
  root.current = uninitailizedFiber
  uninitailizedFiber.stateNode = root
  initialUpdateQueue(uninitailizedFiber)
  return root
}
