/**
 * Shared viewer/list state for the archived-sessions UI. The settings
 * section and the modal viewer live in separate component instances, so the
 * open/close signal and the post-delete list refresh travel through tiny
 * module-level stores (subscribe/use hooks).
 */
import { useEffect, useState } from 'react'

/** Which session the modal viewer is showing (null = closed). */
export interface ViewerState {
  sessionId: string | null
  title: string
}

let viewer: ViewerState = { sessionId: null, title: '' }
const viewerListeners = new Set<() => void>()
const notifyViewer = (): void => {
  for (const listener of viewerListeners) listener()
}

export function openViewer(sessionId: string, title: string): void {
  viewer = { sessionId, title }
  notifyViewer()
}

export function closeViewer(): void {
  viewer = { sessionId: null, title: '' }
  notifyViewer()
}

export function useViewer(): ViewerState {
  const [state, setState] = useState(viewer)
  useEffect(() => {
    const listener = () => setState(viewer)
    viewerListeners.add(listener)
    return () => {
      viewerListeners.delete(listener)
    }
  }, [])
  return state
}

let listVersion = 0
const listListeners = new Set<() => void>()

export function bumpList(): void {
  listVersion += 1
  for (const listener of listListeners) listener()
}

export function useListVersion(): number {
  const [version, setVersion] = useState(listVersion)
  useEffect(() => {
    const listener = () => setVersion(listVersion)
    listListeners.add(listener)
    return () => {
      listListeners.delete(listener)
    }
  }, [])
  return version
}
