# dsh-archived-sessions

> View and manage archived sessions in DSH (DeepSeek Harness): browse the archive list, read full transcripts in a chat-style dialog (turns / reasoning / tool executions / Markdown tables), and remove records you no longer need. Works on desktop and web.

Once a session is archived in DSH it disappears from every surface with no way back. This plugin adds an «Archived Sessions» page to Settings that brings the archive list back.

## Features

- **Archive list**: title, owning workspace, message count and last activity at a glance; refresh supported.
- **Transcript viewer**: click a session to open a read-only chat dialog (rendered above the settings panel; closing returns to the list).
  - Grouped by **turn** — each turn collapses the "working steps" (reasoning, tool calls, command executions) so the final answer stands out;
  - Markdown rendering: headings, ordered/unordered lists, blockquotes, links, code blocks (auto-pretty JSON), **tables** (horizontally scrollable);
  - Tool executions render as terminal cards: tool name, status dot (ok/error), `$` command line, expandable output;
  - System-injected messages (runtime context snapshots, skill catalogs…) are folded separately, never mixed with user messages.
- **Delete archive records**: two-step confirmation; removes the entry from the archive list. DSH has no session-delete API, so this is implemented as a tombstone — the session stays archived (hidden from every product surface) and the data files remain on disk (matching the product's own behavior).

## Install

```bash
# Desktop
dsh plugin add dsh-archived-sessions

# Or manually: add the package to the profile's dependencies and bundles, then restart.
```

After install + restart: **Settings → Archived Sessions**.

## Development

```bash
pnpm install
pnpm build      # esbuild single-file host + client artifacts into lib/
pnpm typecheck
```

Local testing:

```bash
cd ~/.dsh/profiles/desktop
pnpm add file:/path/to/dsh-archived-sessions
# add "dsh-archived-sessions" to dsh.profile.bundles in package.json, restart the app
```

## Architecture

- **Host half** (`src/index.ts` → `runtime.ts`): reads through official DSH services — `workspaceRegistry` (archive set), `sessionQuery` (titles / surface projection), `sessionPersistence.readRaw` (lenient fallback for corrupt logs). Exposes `archived/list`, `archived/surface`, `archived/delete` via Typert Remote. Delete only writes to the plugin's own settings namespace (tombstone) and never touches session data.
- **Client half** (`src/client/index.ts`): mounts the Remote namespace and registers the `settings.section` entry (id `archived-sessions`). The viewer renders inside the settings panel, so it is naturally on top.
- **Compatibility**: official DSH contracts only — no desktop-only services are injected; desktop / web / CLI all work.

## Notes & limitations

- Delete only removes the archive record; session data stays on disk (DSH never deletes session data).
- Corrupt logs (seq gaps) are marked and opened with the readable portion.
- "Continue the conversation / restore" is out of scope (no product API); use DSH's built-in session Fork instead.

## License

MIT
