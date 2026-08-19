/**
 * The hand-written host Typert manifest for the archived Remote. Registered
 * through `ctx.typert.register` in the plugin body, it claims the wire
 * endpoints through the strict registry so the Host Gateway resolves
 * `archived/list`, `archived/surface` and `archived/delete` without
 * consulting the `@Remote` marker table (marker independence matters in
 * source-launch development environments).
 */
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types'
import { ARCHIVED_INVOCATIONS } from './contract.ts'

/** The archived namespace's host manifest (strict codecs shared with the client). */
export const TYPERT_MANIFEST: TypertContribution = {
  package: 'dsh-archived-sessions',
  face: 'host',
  schemas: [],
  model: {
    services: [
      {
        key: 'archived',
        exportName: 'ArchivedSessionsRuntime',
        description: 'List archived sessions, read their surface transcript, and remove archive records.',
        tags: [],
        members: [
          {
            kind: 'method',
            name: 'list',
            signature: 'list(): Promise<ArchivedSessionItem[]>',
          },
          {
            kind: 'method',
            name: 'surface',
            signature: 'surface(request: SurfaceRequest): Promise<SurfaceResult>',
          },
          {
            kind: 'method',
            name: 'delete',
            signature: 'delete(request: DeleteRequest): Promise<{ deleted: true }>',
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: ARCHIVED_INVOCATIONS,
}
