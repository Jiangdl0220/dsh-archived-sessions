/**
 * `archived-sessions` locale namespace: settings page and transcript viewer
 * copy. Chinese is the product copy; English mirrors it.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'nav': '已归档会话',
  'count': '已归档 {n} 个会话',
  'refresh': '刷新',
  'loading': '加载中…',
  'view': '查看',
  'delete': '删除',
  'confirmDelete': '确认删除',
  'deleting': '删除中…',
  'restore': '恢复',
  'confirmRestore': '确认恢复',
  'restoring': '恢复中…',
  'cancel': '取消',
  'close': '关闭',
  'deleteSession': '删除会话',
  'emptyList': '没有已归档的会话。在会话菜单选择「归档会话」后，会话会出现在这里，点击可查看内容。',
  'emptyMessages': '这个会话没有可显示的消息。',
  'loadFailed': '加载失败',
  'corruptBadge': '日志损坏',
  'corruptTitle': '(日志损坏，无法读取标题)',
  'untitled': '(未命名会话)',
  'partialWarning': '会话日志已损坏（seq 缺口），以下为可解析的部分内容。',
  'footNote': '只读查看 · 恢复：会话回到侧边栏活跃列表 · 删除仅移除归档记录（数据保留在磁盘）',
  'user': '用户',
  'assistant': '助手',
  'system': '系统',
  'snapshot': '运行上下文快照',
  'reasoning': '推理过程',
  'workProcess': '工作过程 · 推理与 {n} 项工具执行',
  'workSteps': '工作过程',
  'assistantProcess': '助手过程',
  'toolReturn': '{name} 返回',
  'turn': '第 {n} 轮',
  'output': '输出 · 展开',
  'errorOutput': '错误输出 · 展开',
  'noOutput': '（无输出）',
  'messages': '条消息',
} satisfies Record<string, string>

/** The archived-sessions namespace key union. */
export type ArchivedKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'nav': 'Archived Sessions',
  'count': '{n} archived sessions',
  'refresh': 'Refresh',
  'loading': 'Loading…',
  'view': 'View',
  'delete': 'Delete',
  'confirmDelete': 'Confirm delete',
  'deleting': 'Deleting…',
  'restore': 'Restore',
  'confirmRestore': 'Confirm restore',
  'restoring': 'Restoring…',
  'cancel': 'Cancel',
  'close': 'Close',
  'deleteSession': 'Delete session',
  'emptyList': 'No archived sessions yet. Archive a session from its session menu and it will appear here — click to view its content.',
  'emptyMessages': 'This session has no messages to display.',
  'loadFailed': 'Load failed',
  'corruptBadge': 'Corrupt log',
  'corruptTitle': '(Corrupt log, title unavailable)',
  'untitled': '(Untitled session)',
  'partialWarning': 'The session log is corrupt (seq gap); showing the readable portion.',
  'footNote': 'Read-only · Restore: back to the active sidebar list · Delete only removes the archive record (data stays on disk)',
  'user': 'You',
  'assistant': 'Assistant',
  'system': 'System',
  'snapshot': 'Runtime context snapshot',
  'reasoning': 'Reasoning',
  'workProcess': 'Working steps · reasoning and {n} tool executions',
  'workSteps': 'Working steps',
  'assistantProcess': 'Assistant steps',
  'toolReturn': '{name} result',
  'turn': 'Turn {n}',
  'output': 'Output · expand',
  'errorOutput': 'Error output · expand',
  'noOutput': '(no output)',
  'messages': 'messages',
} satisfies Record<ArchivedKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'archived-sessions'

/** The translated function components receive (key + optional params). */
export type Translate = (key: ArchivedKey, params?: Record<string, string>) => string

/**
 * Fill one dictionary template's `{name}`-style placeholders.
 * @param template - dictionary text.
 * @param params - placeholder values; absent params replace nothing.
 * @returns the filled text.
 */
export function fmt(template: string, params?: Record<string, string>): string {
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => params[key] ?? whole)
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The archived-sessions settings and viewer copy. */
    [NS]: ArchivedKey
  }
}
