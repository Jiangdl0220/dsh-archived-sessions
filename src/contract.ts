/**
 * The archived-sessions wire contract, shared verbatim by the host manifest
 * (`ctx.typert.register` in typert.ts) and the client contribution
 * (`ctx.remote.$mount` in client/remote.ts). The host reads session storage
 * through official DSH services only; no session data is ever mutated here
 * (delete only removes an archive record).
 */
import { z } from 'zod'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'

/** Wire codec: one session identity (branded string on the wire). */
export const sessionIdSchema = z.string().min(1)

/** A workspace reference shown next to an archived session. */
export interface WorkspaceRef {
  readonly id: string
  readonly title: string
  readonly path: string
}
export const workspaceRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  path: z.string(),
}).readonly()

/** One archived-session summary row. */
export interface ArchivedSessionItem {
  readonly sessionId: string
  readonly title: string
  readonly cwd: string | null
  readonly agentPreset: string | null
  readonly createdAt: number | null
  readonly updatedAt: number | null
  readonly workspace: WorkspaceRef | null
  readonly messages: number
  readonly corrupt: boolean
}
export const archivedSessionItemSchema = z.object({
  sessionId: sessionIdSchema,
  title: z.string(),
  cwd: z.string().nullable(),
  agentPreset: z.string().nullable(),
  createdAt: z.number().nullable(),
  updatedAt: z.number().nullable(),
  workspace: workspaceRefSchema.nullable(),
  messages: z.number(),
  corrupt: z.boolean(),
}).readonly()

/** One compact content block of a surface event. */
export interface ContentBlock {
  readonly type: string
  readonly text?: string
  readonly name?: string
  readonly command?: string
  readonly description?: string
  readonly argsRaw?: string
  readonly isError?: boolean
  readonly label?: string
}
export const contentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  name: z.string().optional(),
  command: z.string().optional(),
  description: z.string().optional(),
  argsRaw: z.string().optional(),
  isError: z.boolean().optional(),
  label: z.string().optional(),
}).readonly()

/** One surface event (user/assistant/system message or tool result). */
export interface SurfaceEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly role: 'user' | 'assistant' | 'system' | 'tool' | null
  readonly blocks: readonly ContentBlock[]
  readonly toolName: string | null
  readonly command: string | null
  readonly isError: boolean
  readonly systemKind: string | null
  readonly systemForm: string | null
  readonly surfaceOp: string | null
}
export const surfaceEventSchema = z.object({
  type: z.string(),
  seq: z.number(),
  time: z.number(),
  role: z.enum(['user', 'assistant', 'system', 'tool']).nullable(),
  blocks: z.array(contentBlockSchema),
  toolName: z.string().nullable(),
  command: z.string().nullable(),
  isError: z.boolean(),
  systemKind: z.string().nullable(),
  systemForm: z.string().nullable(),
  surfaceOp: z.string().nullable(),
}).readonly()

/** Read the transcript of one session. */
export interface SurfaceRequest {
  readonly sessionId: string
}
export const surfaceRequestSchema = z.object({
  sessionId: sessionIdSchema,
}).readonly()

/** Transcript result; `partial` marks a corrupt log read leniently. */
export interface SurfaceResult {
  readonly sessionId: string
  readonly events: readonly SurfaceEvent[]
  readonly partial: boolean
  readonly warning: string | null
}
export const surfaceResultSchema = z.object({
  sessionId: sessionIdSchema,
  events: z.array(surfaceEventSchema),
  partial: z.boolean(),
  warning: z.string().nullable(),
}).readonly()

/** Remove one session from the archive list. */
export interface DeleteRequest {
  readonly sessionId: string
}
export const deleteRequestSchema = z.object({
  sessionId: sessionIdSchema,
}).readonly()

export const deleteResultSchema = z.object({
  deleted: z.literal(true),
}).readonly()

/** The archived Remote namespace's strict invocation descriptors. */
export const ARCHIVED_INVOCATIONS: readonly InvocationDescriptor[] = [
  {
    id: 'dsh-archived-sessions#archived/list',
    service: 'archived',
    namespace: 'archived',
    method: 'list',
    invocation: { kind: 'direct' },
    parameters: [],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-archived-sessions#ArchivedSessionItem[]',
      schema: z.array(archivedSessionItemSchema),
    },
  },
  {
    id: 'dsh-archived-sessions#archived/surface',
    service: 'archived',
    namespace: 'archived',
    method: 'surface',
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'request',
        wire: 'request',
        source: 'json',
        codec: {
          mode: 'strict',
          typeSymbol: 'dsh-archived-sessions#SurfaceRequest',
          schema: surfaceRequestSchema,
        },
      },
    ],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-archived-sessions#SurfaceResult',
      schema: surfaceResultSchema,
    },
  },
  {
    id: 'dsh-archived-sessions#archived/delete',
    service: 'archived',
    namespace: 'archived',
    method: 'delete',
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'request',
        wire: 'request',
        source: 'json',
        codec: {
          mode: 'strict',
          typeSymbol: 'dsh-archived-sessions#DeleteRequest',
          schema: deleteRequestSchema,
        },
      },
    ],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-archived-sessions#DeleteResult',
      schema: deleteResultSchema,
    },
  },
]

/** The gateway result shape the client face resolves to. */
export type RemoteResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details: object } }
