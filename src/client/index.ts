/**
 * dsh-archived-sessions client plugin: the browser half. Mounts the
 * `archived` Remote namespace and registers the «Archived Sessions» settings
 * section — the archive list plus the inline transcript viewer (turns,
 * reasoning, tool executions, markdown tables). Desktop and web share this
 * bundle; no desktop-only service is used.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { NS, en, fmt, zh, type Translate } from './locales.ts'
import { ARCHIVED_REMOTE, type ArchivedNamespaceFace } from './remote.ts'
import { SettingsSection, type ArchivedInjected } from './SettingsSection.tsx'
import { adoptStyles } from './styles.ts'

/** Cordis plugin name (the Loader entry and client bundle id). */
export const name = '@jiangdaoli/dsh-archived-sessions'

/** Required services: Remote gateway, slot system, and locale. */
export const inject = ['remote', 'slots', 'locale']

/**
 * Custom glyph for the archived-sessions section in the settings nav.
 *
 * The stock `settings.section` registration carries only `id`/`order`/`label`
 * — a section id that is not one of the shell's hardcoded cases always falls
 * back to the default gear. Third-party settings surfaces achieve a custom
 * icon by marking the rendered nav button and painting their own glyph over
 * the gear (see the CSS in styles.ts). This mirrors that: it keeps a
 * MutationObserver on the document and tags the settings-dialog nav button
 * whose text matches the section label, so the CSS mask takes over.
 * @param label - a getter for the current localized section label.
 * @returns a disposer that stops the observer and unmarks the button.
 */
function adoptSettingsNavGlyph(label: () => string): () => void {
  let disposed = false
  const sync = (): void => {
    if (disposed) return
    const current = label().trim()
    const buttons = document.querySelectorAll<HTMLButtonElement>('[role="dialog"] nav button')
    buttons.forEach((button) => {
      if (current !== '' && button.textContent?.trim() === current) button.setAttribute('data-dsh-arch-nav-icon', '')
      else button.removeAttribute('data-dsh-arch-nav-icon')
    })
  }
  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  return () => {
    disposed = true
    observer.disconnect()
    document.querySelectorAll('[data-dsh-arch-nav-icon]').forEach((element) => element.removeAttribute('data-dsh-arch-nav-icon'))
  }
}

/**
 * Compose the archived-sessions surface.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-archived-sessions: dictionaries')
  const bound = ctx.locale.bind(NS)
  const t: Translate = (key, params) => fmt(bound(key), params)

  // The mounted namespace handle resolves through the service store
  // (`ctx.reflect.get`), not through `ctx.remote.archived` (the dotted read
  // walks the cordis fiber chain, which stops at the Loader's runtime-less
  // internal forks).
  let archived: ArchivedNamespaceFace | undefined
  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(ARCHIVED_REMOTE)
    archived = (ctx.reflect as unknown as { get(name: string): unknown }).get('remote.archived') as ArchivedNamespaceFace | undefined
    if (archived === undefined) {
      throw new Error('dsh-archived-sessions: the archived Remote namespace did not mount')
    }
    return () => {
      archived = undefined
      void dispose()
    }
  }, 'dsh-archived-sessions: remote')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'archived-sessions',
    order: 60,
    label: () => t('nav'),
    locale: NS,
    inject: (): ArchivedInjected => ({
      getRemote: () => archived,
    }),
  }, SettingsSection))

  // Custom settings-nav glyph (the section registration cannot carry an icon):
  // tag the nav button matching our label so the CSS mask paints our icon over
  // the default gear. Reactive to the dialog mounting and to locale changes.
  ctx.effect(() => adoptSettingsNavGlyph(() => t('nav')), 'dsh-archived-sessions: settings nav glyph')
}
