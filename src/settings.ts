/**
 * The plugin-owned tombstone namespace: session ids the user chose to
 * remove from the archive list. DSH has no session-delete API, and removing
 * a session from `archivedSessionIds` would resurrect it as a stray row in
 * the sidebar (the product UI shows non-archived, unaccounted sessions).
 * So delete keeps the session archived (hidden from every product surface)
 * and records the id here so this plugin's own list stops showing it.
 * Session data itself is never touched — consistent with the product, which
 * never deletes session logs.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'

/** The branded namespace name (persisted durably through the settings provider). */
export const TOMBSTONE_NAMESPACE = settingsNamespace('dsh-archived-sessions')

/** Schemastery schema of the tombstone section. */
export const TombstoneSchema: z<{ deleted: string[] }> = z.object({
  deleted: z.array(z.string()).default([]),
})

/**
 * Register the namespace and return its owner scope.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope backing the runtime's live tombstone read/write.
 */
export function registerTombstones(ctx: Context): SettingsScope<{ deleted: string[] }> {
  return ctx.settings.register(TOMBSTONE_NAMESPACE, TombstoneSchema, { applies: 'live' })
}
