/**
 * The archived-sessions settings section: the archive list (title, workspace,
 * message count, last activity) with View / Delete actions, plus the inline
 * transcript viewer modal. Registered into `settings.section` — a fresh
 * additive section next to the shipped entries.
 */
import { useEffect, useState, type ReactElement } from 'react'
import type { PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { ArchivedSessionItem } from '../contract.ts'
import type { ArchivedNamespaceFace } from './remote.ts'
import { bumpList, closeViewer, openViewer, useListVersion, useViewer } from './store.ts'
import { ArchivedViewer } from './Viewer.tsx'
import type { Translate } from './locales.ts'

/** Injected business face: a lazily-resolved handle to the archived Remote. */
export interface ArchivedInjected {
  getRemote: () => ArchivedNamespaceFace | undefined
}

/** Full section props: runtime share + injected face + locale seat. */
export type ArchivedSectionProps = PropsRuntime<'settings.section'> & InjectFace<ArchivedInjected> & { t: Translate }

const fmtTime = (value: number | null): string => {
  if (typeof value !== 'number') return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

/** The archive list plus the inline viewer. */
export function SettingsSection({ getRemote, t }: ArchivedSectionProps): ReactElement {
  const version = useListVersion()
  const viewer = useViewer()
  const [list, setList] = useState<{ items: ArchivedSessionItem[] | null; error: string | null; loading: boolean }>({
    items: null,
    error: null,
    loading: false,
  })
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadList = (): void => {
    setList({ items: null, error: null, loading: true })
    const remote = getRemote()
    if (remote === undefined) {
      setList({ items: null, error: 'Remote unavailable', loading: false })
      return
    }
    remote.list().then((result) => {
      if (result.ok) setList({ items: result.value, error: null, loading: false })
      else setList({ items: null, error: result.error.message, loading: false })
    }).catch((error: unknown) => {
      setList({ items: null, error: String(error instanceof Error ? error.message : error), loading: false })
    })
  }

  useEffect(() => {
    loadList()
  }, [version])

  const remove = (sessionId: string): void => {
    setBusy(true)
    setActionError(null)
    const remote = getRemote()
    if (remote === undefined) {
      setBusy(false)
      setActionError('Remote unavailable')
      return
    }
    remote.delete({ sessionId }).then((result) => {
      setBusy(false)
      if (result.ok) {
        setConfirmId(null)
        bumpList()
        if (viewer.sessionId === sessionId) closeViewer()
      } else {
        setActionError(result.error.message)
      }
    }).catch((error: unknown) => {
      setBusy(false)
      setActionError(String(error instanceof Error ? error.message : error))
    })
  }

  const restore = (sessionId: string): void => {
    setBusy(true)
    setActionError(null)
    const remote = getRemote()
    if (remote === undefined) {
      setBusy(false)
      setActionError('Remote unavailable')
      return
    }
    remote.restore({ sessionId }).then((result) => {
      setBusy(false)
      if (result.ok) {
        setRestoreConfirmId(null)
        bumpList()
        if (viewer.sessionId === sessionId) closeViewer()
      } else {
        setActionError(result.error.message)
      }
    }).catch((error: unknown) => {
      setBusy(false)
      setActionError(String(error instanceof Error ? error.message : error))
    })
  }

  const items = list.items ?? []
  const rows: ReactElement[] = []
  rows.push(
    <div className="dsh_arch_toolbar" key="toolbar">
      <span className="dsh_arch_count">{t('count', { n: String(items.length) })}</span>
      <button className="dsh_arch_btn" onClick={loadList} disabled={list.loading}>
        {list.loading ? t('loading') : t('refresh')}
      </button>
    </div>,
  )
  if (actionError !== null) rows.push(<div className="dsh_arch_error" key="actionError">⚠ {actionError}</div>)
  if (list.error !== null) rows.push(<div className="dsh_arch_error" key="listError">⚠ {list.error}</div>)
  if (list.loading && items.length === 0) rows.push(<div className="dsh_arch_empty" key="loading">{t('loading')}</div>)
  if (!list.loading && list.error === null && items.length === 0) {
    rows.push(<div className="dsh_arch_empty" key="empty">{t('emptyList')}</div>)
  }
  rows.push(
    <div className="dsh_arch_list" key="list">
      {items.map((item) => {
        const sub = [
          item.workspace !== null ? item.workspace.title : (item.cwd ?? ''),
          item.messages > 0 ? `${item.messages} ${t('messages')}` : '',
          fmtTime(item.updatedAt),
        ].filter((part) => part !== '').join(' · ')
        const title = item.title !== '' ? item.title : (item.corrupt ? t('corruptTitle') : t('untitled'))
        const actions = restoreConfirmId === item.sessionId
          ? [
            <button className="dsh_arch_btn" key="confirmRestore" disabled={busy}
              onClick={(event) => { event.stopPropagation(); restore(item.sessionId) }}>
              {busy ? t('restoring') : t('confirmRestore')}
            </button>,
            <button className="dsh_arch_btn" key="cancel" onClick={(event) => { event.stopPropagation(); setRestoreConfirmId(null) }}>
              {t('cancel')}
            </button>,
          ]
          : confirmId === item.sessionId
            ? [
              <button className="dsh_arch_btn dsh_arch_btn_danger" key="confirm" disabled={busy}
                onClick={(event) => { event.stopPropagation(); remove(item.sessionId) }}>
                {busy ? t('deleting') : t('confirmDelete')}
              </button>,
              <button className="dsh_arch_btn" key="cancel" onClick={(event) => { event.stopPropagation(); setConfirmId(null) }}>
                {t('cancel')}
              </button>,
            ]
            : [
              <button className="dsh_arch_btn" key="view" onClick={(event) => { event.stopPropagation(); openViewer(item.sessionId, item.title) }}>
                {t('view')}
              </button>,
              <button className="dsh_arch_btn" key="restore"
                onClick={(event) => { event.stopPropagation(); setActionError(null); setConfirmId(null); setRestoreConfirmId(item.sessionId) }}>
                {t('restore')}
              </button>,
              <button className="dsh_arch_btn dsh_arch_btn_danger" key="delete"
                onClick={(event) => { event.stopPropagation(); setActionError(null); setRestoreConfirmId(null); setConfirmId(item.sessionId) }}>
                {t('delete')}
              </button>,
            ]
        return (
          <div className="dsh_arch_item" key={item.sessionId} onClick={() => openViewer(item.sessionId, item.title)}>
            <div className="dsh_arch_item_body">
              <div className="dsh_arch_item_title">{title}</div>
              <div className="dsh_arch_item_sub">{sub}</div>
            </div>
            {item.corrupt ? <span className="dsh_arch_badge_corrupt">{t('corruptBadge')}</span> : null}
            <div className="dsh_arch_item_actions">{actions}</div>
          </div>
        )
      })}
    </div>,
  )
  if (viewer.sessionId !== null) rows.push(<ArchivedViewer key="viewer" getRemote={getRemote} t={t} />)
  return <div className="dsh_arch_root">{rows}</div>
}
