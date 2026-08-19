/**
 * The client-side Typert Remote contribution for the archived-sessions host
 * service: mounts the shared strict descriptors into `ctx.remote.archived`.
 * The descriptors and codecs come from the shared contract module, so the
 * browser bundle and the host manifest stay on one wire definition.
 */
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { ARCHIVED_INVOCATIONS } from '../contract.ts'
import type { ArchivedSessionItem, RemoteResult, SurfaceResult } from '../contract.ts'

/** The archived Remote namespace's client contribution. */
export const ARCHIVED_REMOTE: TypertRemoteContribution = {
  package: 'dsh-archived-sessions',
  descriptors: ARCHIVED_INVOCATIONS,
}

/** The callable face of the mounted `remote.archived` namespace. */
export interface ArchivedNamespaceFace {
  list(): Promise<RemoteResult<ArchivedSessionItem[]>>
  surface(request: { sessionId: string }): Promise<RemoteResult<SurfaceResult>>
  delete(request: { sessionId: string }): Promise<RemoteResult<{ deleted: true }>>
}
