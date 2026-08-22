/**
 * The archived-sessions transcript viewer: a modal dialog rendered inside
 * the settings section (the settings panel is the app's top modal layer, so
 * the fixed overlay covers everything and closing it returns to the session
 * list). Transcripts are grouped into turns — each turn separates the
 * collapsed "working steps" (reasoning, tool calls, command executions)
 * from the final assistant answers — and messages render through the
 * markdown-lite renderer.
 */
import { useEffect, useState, type ReactElement } from 'react'
import type { ContentBlock, SurfaceEvent } from '../contract.ts'
import type { ArchivedNamespaceFace } from './remote.ts'
import { bumpList, closeViewer, useViewer } from './store.ts'
import { RichText, prettyJson } from './markdown.tsx'
import type { Translate } from './locales.ts'

const fmtTime = (value: number): string => {
  if (typeof value !== 'number') return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

const Block = ({ block, t }: { block: ContentBlock; t: Translate }): ReactElement | null => {
  if (block === null || typeof block !== 'object') return null
  if (block.type === 'text') return <RichText text={block.text ?? ''} />
  if (block.type === 'reasoning') {
    return (
      <div className="dsh_arch_work_msg">
        <span className="dsh_arch_work_label">{t('reasoning')}</span>
        <div className="dsh_arch_inner" style={{ marginTop: 0 }}>{block.text ?? ''}</div>
      </div>
    )
  }
  if (block.type === 'tool-call') {
    return (
      <div className="dsh_arch_chip">
        <span>{block.name ?? ''}</span>
        {block.command !== undefined && block.command !== '' ? <code>{block.command}</code> : null}
      </div>
    )
  }
  if (block.type === 'tool-result') {
    return (
      <details className="dsh_arch_details">
        <summary>{t('toolReturn', { name: block.name ?? t('system') })}</summary>
        <div className="dsh_arch_inner">{prettyJson(block.text ?? '')}</div>
      </details>
    )
  }
  return <div className="dsh_arch_p">[{block.label ?? block.type}]</div>
}

const MessageRow = ({ event, t }: { event: SurfaceEvent; t: Translate }): ReactElement => {
  const isUser = event.role === 'user'
  const side = isUser ? 'right' : 'left'
  const children: ReactElement[] = [
    <div className="dsh_arch_bubble_head" key="head">
      <span>{isUser ? t('user') : t('assistant')}</span>
      <span className="dsh_arch_time">{fmtTime(event.time)}</span>
    </div>,
  ]
  for (const block of event.blocks ?? []) {
    if (block.type === 'text') {
      children.push(<RichText key={`t${children.length}`} text={block.text ?? ''} />)
    } else if (block.type === 'reasoning') {
      children.push(
        <details className="dsh_arch_details" key={`r${children.length}`}>
          <summary>{t('reasoning')}</summary>
          <div className="dsh_arch_inner">{block.text ?? ''}</div>
        </details>,
      )
    } else {
      children.push(<Block key={`b${children.length}`} block={block} t={t} />)
    }
  }
  return (
    <div className={`dsh_arch_chat ${side === 'right' ? 'dsh_arch_chat_right' : 'dsh_arch_chat_left'}`}>
      <div className={`dsh_arch_bubble ${side === 'right' ? 'dsh_arch_bubble_right' : 'dsh_arch_bubble_left'}`}>{children}</div>
    </div>
  )
}

const SystemRow = ({ event, t }: { event: SurfaceEvent; t: Translate }): ReactElement => {
  const label = event.systemForm === 'snapshot' ? t('snapshot') : String(event.systemKind ?? t('system'))
  const text = (event.blocks ?? []).map((block) => block.text ?? '').join('\n')
  return (
    <div className="dsh_arch_chat dsh_arch_chat_left">
      <div className="dsh_arch_system">
        <details>
          <summary>{`${t('system')} · ${label} · ${fmtTime(event.time)}`}</summary>
          {text !== '' ? <div className="dsh_arch_inner">{text}</div> : null}
        </details>
      </div>
    </div>
  )
}

const ToolCard = ({ event, t }: { event: SurfaceEvent; t: Translate }): ReactElement => {
  const command = event.command ?? ''
  const output = (event.blocks ?? []).map((block) => block.text ?? '').join('\n')
  const isError = event.isError === true
  return (
    <div className="dsh_arch_chat dsh_arch_chat_left">
      <div className={`dsh_arch_toolcard${isError ? ' dsh_arch_toolcard_err' : ''}`}>
        <div className="dsh_arch_toolcard_head">
          <span className="dsh_arch_toolcard_name">{event.toolName ?? t('system')}</span>
          <span className={`dsh_arch_toolcard_dot ${isError ? 'dsh_arch_dot_err' : 'dsh_arch_dot_ok'}`} />
          <span className="dsh_arch_toolcard_time">{fmtTime(event.time)}</span>
        </div>
        {command !== '' ? (
          <div className="dsh_arch_toolcard_cmdline">
            <span className="dsh_arch_ps1">$</span>
            <code>{command}</code>
          </div>
        ) : null}
        {output !== '' ? (
          <details className="dsh_arch_toolcard_out_wrap">
            <summary>{isError ? t('errorOutput') : t('output')}</summary>
            <pre className="dsh_arch_toolcard_out">{prettyJson(output)}</pre>
          </details>
        ) : (
          <div className="dsh_arch_toolcard_empty">{t('noOutput')}</div>
        )}
      </div>
    </div>
  )
}

const WorkMsg = ({ event, t }: { event: SurfaceEvent; t: Translate }): ReactElement => {
  const children: ReactElement[] = []
  for (const block of event.blocks ?? []) {
    if (block.type === 'text') {
      children.push(<RichText key={`t${children.length}`} text={block.text ?? ''} />)
    } else {
      children.push(<Block key={`b${children.length}`} block={block} t={t} />)
    }
  }
  return (
    <div className="dsh_arch_work_msg">
      <span className="dsh_arch_work_label">{t('assistantProcess')}</span>
      {children}
    </div>
  )
}

interface TurnSection {
  kind: 'turn'
  user: SurfaceEvent | null
  work: SurfaceEvent[]
  answers: SurfaceEvent[]
}

type Section = { kind: 'system'; event: SurfaceEvent } | TurnSection

function groupEvents(events: readonly SurfaceEvent[]): Section[] {
  const sections: Section[] = []
  for (const event of events) {
    if (event.role === 'system') {
      sections.push({ kind: 'system', event })
      continue
    }
    if (event.role === 'user') {
      sections.push({ kind: 'turn', user: event, work: [], answers: [] })
      continue
    }
    let turn: TurnSection | null = null
    for (let i = sections.length - 1; i >= 0; i--) {
      const candidate = sections[i]
      if (candidate.kind === 'turn') {
        turn = candidate
        break
      }
    }
    if (turn === null) {
      sections.push({ kind: 'turn', user: null, work: [], answers: [] })
      turn = sections[sections.length - 1] as TurnSection
    }
    if (event.role === 'tool') {
      turn.work.push(event)
    } else {
      const hasText = (event.blocks ?? []).some((block) => block.type === 'text')
      if (hasText) turn.answers.push(event)
      else turn.work.push(event)
    }
  }
  return sections
}

const TurnBlock = ({ section, turnIndex, t }: { section: TurnSection; turnIndex: number; t: Translate }): ReactElement => {
  const children: ReactElement[] = []
  if (turnIndex > 0) {
    children.push(
      <div className="dsh_arch_turn_divider" key="divider">
        <span>{t('turn', { n: String(turnIndex + 1) })}</span>
      </div>,
    )
  }
  if (section.user !== null) children.push(<MessageRow key="user" event={section.user} t={t} />)
  if (section.work.length > 0) {
    children.push(
      <details className="dsh_arch_work" key="work">
        <summary>{t('workProcess', { n: String(section.work.length) })}</summary>
        <div className="dsh_arch_work_body">
          {section.work.map((event, index) => (
            event.role === 'tool'
              ? <ToolCard key={`tool${index}`} event={event} t={t} />
              : <WorkMsg key={`work${index}`} event={event} t={t} />
          ))}
        </div>
      </details>,
    )
  }
  for (const event of section.answers) {
    children.push(<MessageRow key={`answer${event.seq}`} event={event} t={t} />)
  }
  return <div className="dsh_arch_turn">{children}</div>
}

/** The modal transcript viewer. */
export const ArchivedViewer = ({ getRemote, t }: { getRemote: () => ArchivedNamespaceFace | undefined; t: Translate }): ReactElement | null => {
  const viewer = useViewer()
  const [detail, setDetail] = useState<{
    events: readonly SurfaceEvent[] | null
    error: string | null
    loading: boolean
    partial: boolean
    warning: string | null
  }>({ events: null, error: null, loading: false, partial: false, warning: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (viewer.sessionId === null) return
    let alive = true
    setDetail({ events: null, error: null, loading: true, partial: false, warning: null })
    const remote = getRemote()
    if (remote === undefined) {
      setDetail({ events: null, error: 'Remote unavailable', loading: false, partial: false, warning: null })
      return
    }
    remote.surface({ sessionId: viewer.sessionId }).then((result) => {
      if (!alive) return
      if (result.ok) {
        setDetail({
          events: result.value.events,
          error: null,
          loading: false,
          partial: result.value.partial,
          warning: result.value.warning,
        })
      } else {
        setDetail({ events: null, error: result.error.message, loading: false, partial: false, warning: null })
      }
    }).catch((error: unknown) => {
      if (alive) {
        setDetail({ events: null, error: String(error instanceof Error ? error.message : error), loading: false, partial: false, warning: null })
      }
    })
    return () => {
      alive = false
    }
  }, [viewer.sessionId])

  if (viewer.sessionId === null) return null
  const sessionId: string = viewer.sessionId

  const doDelete = (): void => {
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
        bumpList()
        closeViewer()
      } else {
        setActionError(result.error.message)
      }
    }).catch((error: unknown) => {
      setBusy(false)
      setActionError(String(error instanceof Error ? error.message : error))
    })
  }

  const doRestore = (): void => {
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
        bumpList()
        closeViewer()
      } else {
        setActionError(result.error.message)
      }
    }).catch((error: unknown) => {
      setBusy(false)
      setActionError(String(error instanceof Error ? error.message : error))
    })
  }

  const body: ReactElement[] = []
  if (detail.warning !== null) {
    body.push(<div className="dsh_arch_banner" key="warning">{detail.warning}</div>)
  }
  if (detail.loading) {
    body.push(<div className="dsh_arch_empty" key="loading">{t('loading')}</div>)
  } else if (detail.error !== null) {
    body.push(<div className="dsh_arch_error" key="error">⚠ {detail.error}</div>)
  } else if (detail.events !== null) {
    if (detail.events.length === 0) {
      body.push(<div className="dsh_arch_empty" key="empty">{t('emptyMessages')}</div>)
    } else {
      const sections = groupEvents(detail.events)
      let turnIndex = 0
      for (const section of sections) {
        if (section.kind === 'system') {
          body.push(<SystemRow key={`system${section.event.seq}`} event={section.event} t={t} />)
        } else {
          body.push(<TurnBlock key={`turn${turnIndex}`} section={section} turnIndex={turnIndex} t={t} />)
          turnIndex++
        }
      }
    }
  }

  const foot: ReactElement[] = []
  if (actionError !== null) {
    foot.push(<span className="dsh_arch_error" key="actionError">⚠ {actionError}</span>)
  }
  foot.push(<span className="dsh_arch_foot_note" key="note">{t('footNote')}</span>)
  if (confirmDelete) {
    foot.push(
      <button className="dsh_arch_btn dsh_arch_btn_danger" key="confirm" onClick={doDelete} disabled={busy}>
        {busy ? t('deleting') : t('confirmDelete')}
      </button>,
    )
    foot.push(<button className="dsh_arch_btn" key="cancel" onClick={() => setConfirmDelete(false)}>{t('cancel')}</button>)
  } else if (confirmRestore) {
    foot.push(
      <button className="dsh_arch_btn" key="confirmRestore" onClick={doRestore} disabled={busy}>
        {busy ? t('restoring') : t('confirmRestore')}
      </button>,
    )
    foot.push(<button className="dsh_arch_btn" key="cancel" onClick={() => setConfirmRestore(false)}>{t('cancel')}</button>)
  } else {
    foot.push(
      <button className="dsh_arch_btn" key="restore"
        onClick={() => { setActionError(null); setConfirmDelete(false); setConfirmRestore(true) }}>
        {t('restore')}
      </button>,
      <button className="dsh_arch_btn dsh_arch_btn_danger" key="delete"
        onClick={() => { setActionError(null); setConfirmRestore(false); setConfirmDelete(true) }}>
        {t('deleteSession')}
      </button>,
    )
  }
  foot.push(<button className="dsh_arch_btn" key="close" onClick={closeViewer}>{t('close')}</button>)

  return (
    <div className="dsh_arch_mask" onClick={(event) => { if (event.target === event.currentTarget) closeViewer() }}>
      <div className="dsh_arch_dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dsh_arch_dialog_head">
          <span className="dsh_arch_dialog_title">{viewer.title !== '' ? viewer.title : t('untitled')}</span>
          <button className="dsh_arch_dialog_close" onClick={closeViewer}>{t('close')}</button>
        </div>
        <div className="dsh_arch_dialog_body">{body}</div>
        <div className="dsh_arch_dialog_foot">{foot}</div>
      </div>
    </div>
  )
}
