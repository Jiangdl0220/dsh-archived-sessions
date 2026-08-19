/**
 * The dsh-archived-sessions host Remote service (`ctx.archived`, wire
 * namespace `archived`). Registered as a TypertRemoteService so the Host
 * Gateway exposes `archived/list`, `archived/surface` and `archived/delete`
 * to the Web client under `/api/archived/<method>` with zero generated
 * artifacts. All reads go through the official DSH services
 * (`workspaceRegistry`, `sessionQuery`, `sessionPersistence`); delete only
 * records a tombstone and never touches session data.
 */
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {
  ArchivedSessionItem,
  ContentBlock,
  DeleteRequest,
  SurfaceEvent,
  SurfaceRequest,
  SurfaceResult,
} from './contract.ts'

/** Minimal structural faces of the DSH services the runtime reads. */
interface WorkspaceLike {
  id: string
  title: string
  path: string
  sessionIds: string[]
}
interface WorkspaceRegistryLike {
  archivedSessionIds: string[]
  list(): WorkspaceLike[]
}
interface TitleSnapshot {
  sessionId: string
  status: string
  value?: {
    session?: { id?: string; cwd?: string; agentPreset?: string; createdAt?: number }
    title?: { title?: string }
  }
  reason?: unknown
}
interface SurfaceLoad {
  events: SurfaceRawEvent[]
}
/** A raw content block as stored in the log (richer than the wire shape). */
interface RawBlock {
  type?: string
  text?: string
  name?: string
  id?: string
  arguments?: string
  toolCallId?: string
  isError?: boolean
  content?: RawBlock[]
}
interface SurfaceRawEvent {
  type?: string
  seq?: number
  time?: number
  data?: {
    source?: { kind?: string; form?: string }
    role?: string
    content?: RawBlock[]
    message?: { role?: string; content?: RawBlock[] }
  }
  surfaceOp?: unknown
}
interface SessionQueryLike {
  readTitleSnapshots(ids: string[]): Promise<TitleSnapshot[]>
  readSurface(id: string): Promise<SurfaceLoad>
}
interface PersistenceLike {
  readRaw(id: string): Promise<{ content: string } | undefined>
}

/** Runtime service: archived-session browsing for the web settings page. */
export class ArchivedSessionsRuntime extends TypertRemoteService {
  private readonly readDeleted: () => ReadonlySet<string>
  private readonly persistDeleted: (ids: readonly string[]) => Promise<void>

  constructor(
    ctx: Context,
    readDeleted: () => ReadonlySet<string>,
    persistDeleted: (ids: readonly string[]) => Promise<void>,
  ) {
    super(ctx, 'archived')
    this.readDeleted = readDeleted
    this.persistDeleted = persistDeleted
  }

  /** List archived sessions (minus tombstoned ids), newest activity last. */
  @Remote
  async list(): Promise<ArchivedSessionItem[]> {
    const registry = this.ctx.get('workspaceRegistry') as WorkspaceRegistryLike | undefined
    const query = this.ctx.get('sessionQuery') as SessionQueryLike | undefined
    if (registry === undefined || query === undefined) {
      throw new Error('workspaceRegistry/sessionQuery service unavailable')
    }
    const tombstoned = this.readDeleted()
    const ids = registry.archivedSessionIds.filter((id) => !tombstoned.has(id))
    let titles: TitleSnapshot[] = []
    try {
      titles = await query.readTitleSnapshots(ids)
    } catch {
      /* tolerate per-session failures below */
    }
    let workspaces: WorkspaceLike[] = []
    try {
      workspaces = registry.list()
    } catch {
      /* tolerate */
    }
    const items: ArchivedSessionItem[] = []
    for (let i = 0; i < ids.length; i++) {
      const sid = ids[i]
      const snapshot = titles[i]
      const value = snapshot !== undefined && snapshot.status === 'fulfilled' ? snapshot.value : undefined
      const titleSnap = value?.title
      const header = value?.session
      let surface: SurfaceLoad | null = null
      let corrupt = false
      try {
        surface = await query.readSurface(sid)
      } catch {
        corrupt = true
      }
      let updatedAt: number | null = null
      let messages = 0
      if (surface !== null && Array.isArray(surface.events)) {
        const last = surface.events[surface.events.length - 1]
        updatedAt = typeof last?.time === 'number' ? last.time : null
        messages = surface.events.filter(
          (e) => e.type === 'user/message' || e.type === 'assistant/message',
        ).length
      }
      let ws: WorkspaceLike | null = null
      for (const w of workspaces) {
        if (Array.isArray(w.sessionIds) && w.sessionIds.includes(sid)) {
          ws = w
          break
        }
      }
      items.push({
        sessionId: sid,
        title: titleSnap?.title ?? '',
        cwd: header?.cwd ?? null,
        agentPreset: header?.agentPreset ?? null,
        createdAt: header?.createdAt ?? null,
        updatedAt,
        workspace: ws === null ? null : { id: ws.id, title: ws.title, path: ws.path },
        messages,
        corrupt,
      })
    }
    return items
  }

  /** Read one session's transcript (falling back to a lenient raw read for corrupt logs). */
  @Remote
  async surface(request: SurfaceRequest): Promise<SurfaceResult> {
    const query = this.ctx.get('sessionQuery') as SessionQueryLike | undefined
    if (query === undefined) throw new Error('sessionQuery service unavailable')
    try {
      const data = await query.readSurface(request.sessionId)
      const maps = buildMaps(data.events)
      return {
        sessionId: request.sessionId,
        events: data.events.map((e) => mapEvent(e, maps)),
        partial: false,
        warning: null,
      }
    } catch (error) {
      const original = String(error instanceof Error ? error.message : error)
      const persistence = this.ctx.get('sessionPersistence') as PersistenceLike | undefined
      if (persistence === undefined || typeof persistence.readRaw !== 'function') {
        throw new Error(original)
      }
      let raw: { content: string } | undefined
      try {
        raw = await persistence.readRaw(request.sessionId)
      } catch {
        throw new Error(original)
      }
      if (raw === undefined || typeof raw.content !== 'string') throw new Error(original)
      const list: SurfaceRawEvent[] = []
      for (const line of raw.content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed === '') continue
        let rec: SurfaceRawEvent
        try {
          rec = JSON.parse(trimmed) as SurfaceRawEvent
        } catch {
          continue
        }
        if (rec === null || typeof rec !== 'object' || typeof rec.seq !== 'number' || typeof rec.type !== 'string') continue
        if (rec.type !== 'user/message' && rec.type !== 'assistant/message' && rec.type !== 'tool/result') continue
        if (rec.surfaceOp === undefined) continue
        list.push(rec)
      }
      list.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      const maps = buildMaps(list)
      const seen = new Set<number>()
      const events: SurfaceEvent[] = []
      for (const rec of list) {
        if (rec.seq === undefined || seen.has(rec.seq)) continue
        seen.add(rec.seq)
        events.push(mapEvent(rec, maps))
      }
      return {
        sessionId: request.sessionId,
        events,
        partial: true,
        warning: 'The session log is corrupt (seq gap); showing the readable portion.',
      }
    }
  }

  /** Remove one session from the archive list (tombstone; data is never touched). */
  @Remote
  async delete(request: DeleteRequest): Promise<{ deleted: true }> {
    const registry = this.ctx.get('workspaceRegistry') as WorkspaceRegistryLike | undefined
    if (registry === undefined) throw new Error('workspaceRegistry service unavailable')
    const archived = registry.archivedSessionIds
    if (!Array.isArray(archived) || !archived.includes(request.sessionId)) {
      throw new Error('session is not in the archive list')
    }
    const next = [...this.readDeleted(), request.sessionId]
    await this.persistDeleted(next)
    return { deleted: true }
  }
}

const truncate = (text: string, max: number): string => (
  text.length > max ? `${text.slice(0, max)}…` : text
)

const compactBlocks = (blocks: RawBlock[] | undefined, maxText: number, maps: ToolMaps): ContentBlock[] => {
  if (!Array.isArray(blocks)) return []
  const out: ContentBlock[] = []
  for (const block of blocks) {
    if (block === null || typeof block !== 'object') continue
    if (block.type === 'text') {
      out.push({ type: 'text', text: truncate(block.text ?? '', maxText) })
    } else if (block.type === 'reasoning') {
      out.push({ type: 'reasoning', text: truncate(block.text ?? '', maxText) })
    } else if (block.type === 'tool-call') {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(block.arguments ?? '{}') as Record<string, unknown>
      } catch {
        args = {}
      }
      const command = typeof args.command === 'string' ? args.command : ''
      const description = typeof args.description === 'string' ? args.description : ''
      out.push({
        type: 'tool-call',
        name: block.name ?? '',
        command,
        description,
        argsRaw: truncate(JSON.stringify(args), 300),
      })
    } else if (block.type === 'tool-result') {
      const inner = (block.content ?? [])
        .map((c: RawBlock) => (c?.type === 'text' ? (c.text ?? '') : truncate(JSON.stringify(c), 400)))
        .join('\n')
      const name = block.toolCallId !== undefined ? maps.nameByCall.get(block.toolCallId) : undefined
      const command = block.toolCallId !== undefined ? maps.cmdByCall.get(block.toolCallId) : undefined
      out.push({
        type: 'tool-result',
        name: name ?? '',
        command: command ?? '',
        isError: block.isError === true,
        text: truncate(inner, maxText),
      })
    } else {
      out.push({ type: 'other', label: String(block.type) })
    }
  }
  return out
}

interface ToolMaps {
  nameByCall: Map<string, string>
  cmdByCall: Map<string, string>
}

const buildMaps = (events: SurfaceRawEvent[]): ToolMaps => {
  const nameByCall = new Map<string, string>()
  const cmdByCall = new Map<string, string>()
  for (const event of events) {
    if (event.type !== 'assistant/message') continue
    const blocks = event.data?.message?.content ?? []
    for (const block of blocks) {
      if (block?.type !== 'tool-call' || typeof block.id !== 'string') continue
      if (typeof block.name === 'string') nameByCall.set(block.id, block.name)
      try {
        const parsed = JSON.parse(block.arguments ?? '{}') as { command?: unknown }
        if (typeof parsed.command === 'string') cmdByCall.set(block.id, parsed.command)
      } catch {
        /* ignore */
      }
    }
  }
  return { nameByCall, cmdByCall }
}

const mapEvent = (event: SurfaceRawEvent, maps: ToolMaps): SurfaceEvent => {
  const data = event.data ?? {}
  let role: SurfaceEvent['role'] = null
  let blocks: ContentBlock[] = []
  let toolName: string | null = null
  let command: string | null = null
  let isError = false
  let systemKind: string | null = null
  let systemForm: string | null = null
  if (event.type === 'user/message') {
    const source = data.source ?? {}
    if (source.kind === 'user') {
      role = 'user'
    } else {
      role = 'system'
      systemKind = source.kind ?? 'plugin'
      systemForm = source.form ?? null
    }
    blocks = compactBlocks(data.content, 4000, maps)
  } else if (event.type === 'assistant/message') {
    role = (data.message?.role as SurfaceEvent['role']) ?? 'assistant'
    blocks = compactBlocks(data.message?.content, 4000, maps)
  } else if (event.type === 'tool/result') {
    role = 'tool'
    blocks = compactBlocks(data.message?.content, 2500, maps)
    for (const block of blocks) {
      if (block.type === 'tool-result') {
        if (block.name !== undefined && block.name !== '') toolName = block.name
        if (block.command !== undefined && block.command !== '') command = block.command
        if (block.isError === true) isError = true
      }
    }
  }
  return {
    type: event.type ?? '',
    seq: event.seq ?? 0,
    time: event.time ?? 0,
    role,
    blocks,
    toolName,
    command,
    isError,
    systemKind,
    systemForm,
    surfaceOp: event.surfaceOp === undefined ? null : String(event.surfaceOp),
  }
}
