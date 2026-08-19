/**
 * dsh-archived-sessions host plugin: reads archived sessions through the
 * official DSH services (`workspaceRegistry` for the archive set,
 * `sessionQuery` for titles/surfaces, `sessionPersistence.readRaw` as the
 * corrupt-log fallback) and exposes them to the browser via the `archived`
 * Typert Remote namespace. Delete records a durable tombstone in a
 * plugin-owned settings namespace; session data is never modified. The
 * client half ships in the same package (`./client`); the web server serves
 * it under /plugins/dsh-archived-sessions/client.js.
 *
 * Desktop + web compatible: only official DSH contracts are used, no
 * desktop-only services are injected.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: brings the `ctx.typert` Context merge into this program.
import type {} from '@deepseek-ai/dsh-typert-registry'
import { ArchivedSessionsRuntime } from './runtime.ts'
import { TYPERT_MANIFEST } from './typert.ts'
import { registerTombstones } from './settings.ts'

/** Cordis plugin name (the Loader entry and client bundle id). */
export const name = '@jiangdl0220/dsh-archived-sessions'

/** Services required before load: the Typert registry and the settings provider. */
export const inject = ['typert', 'settings']

/**
 * Mount the archived service and its strict Typert manifest.
 * @param ctx - host cordis context.
 */
export function apply(ctx: Context): void {
  const tombstones = registerTombstones(ctx)
  const readDeleted = () => new Set(tombstones.get().deleted)
  const persistDeleted = async (ids: readonly string[]): Promise<void> => {
    await tombstones.update({ deleted: [...ids] })
  }
  new ArchivedSessionsRuntime(ctx, readDeleted, persistDeleted)
  // Strict endpoint registration: the gateway resolves archived/* from this
  // manifest, independent of decorator marker state.
  ctx.effect(() => {
    const dispose = ctx.typert.register(TYPERT_MANIFEST)
    return () => {
      void dispose()
    }
  }, 'dsh-archived-sessions: typert manifest')
}
