import { markUpdateLaneFromFiberToRoot } from "./ReactFiberClassUpdateQueue"

export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      pending: null,
    },
  }

  fiber.updateQueue = queue
}

export function createUpdate() {
  const update = {}
  return update
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  const pending = updateQueue.shared.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  updateQueue.shared.pending = update
  return markUpdateLaneFromFiberToRoot(fiber)
}
