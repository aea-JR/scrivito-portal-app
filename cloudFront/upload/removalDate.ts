import { HeadObject } from './listHeadObjects'

export const REMOVE_AFTER_DATE_KEY = 'removeafterepochms'

export function containsRemovalDate(headObject: HeadObject): boolean {
  return extractRemoveAfterEpoch(headObject.Metadata) !== undefined
}

export function isRemovalDateReached(headObject: HeadObject): boolean {
  const removeAfter = extractRemoveAfterEpoch(headObject.Metadata)
  return removeAfter !== undefined && removeAfter <= Date.now()
}

function extractRemoveAfterEpoch(
  metadata?: Record<string, string>,
): number | undefined {
  if (!metadata) return

  const epochString = metadata[REMOVE_AFTER_DATE_KEY]
  if (!epochString || typeof epochString !== 'string') return

  const epochNumber = Number(epochString)
  if (!Number.isSafeInteger(epochNumber)) return

  return epochNumber
}
