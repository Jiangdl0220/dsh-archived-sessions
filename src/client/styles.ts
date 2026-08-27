/**
 * The archived-sessions stylesheet, hand-written as a template string and
 * injected once by the plugin body: the web server serves exactly one file
 * per client plugin, so no separate CSS artifact may exist. Colors come
 * from the shared `--dsw-alias-*` design platform (with `color-mix` tints);
 * class names carry the `dsh_arch_` prefix to stay unique in the assembled
 * shell.
 */

/** Stable `<style>` element id (idempotent injection across HMR re-runs). */
export const STYLE_ID = 'dsh-archived-sessions-style'

/** The injected stylesheet text. */
export const cssText = `
.dsh_arch_root {
  font-family: inherit;
  color: var(--dsw-alias-label-primary);
}
.dsh_arch_toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.dsh_arch_count {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: 0.02em;
}
.dsh_arch_btn {
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l2);
  color: inherit;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dsh_arch_btn:hover {
  border-color: var(--dsw-alias-label-tertiary);
}
.dsh_arch_btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.dsh_arch_btn_danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dsh_arch_btn_danger:hover {
  border-color: var(--dsw-alias-state-error-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);
}
.dsh_arch_list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh_arch_item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 9px 12px;
  cursor: pointer;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-2)) 50%, transparent);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.dsh_arch_item:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  border-color: var(--dsw-alias-label-tertiary);
}
.dsh_arch_item_body {
  flex: 1;
  min-width: 0;
}
.dsh_arch_item_title {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh_arch_item_sub {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  letter-spacing: 0.01em;
}
.dsh_arch_item_actions {
  display: flex;
  gap: 6px;
  flex: none;
}
.dsh_arch_badge_corrupt {
  flex: none;
  font-size: 10px;
  color: #e8a25a;
  border: 1px solid color-mix(in srgb, #e8a25a 45%, transparent);
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}
.dsh_arch_filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.dsh_arch_search {
  flex: 1;
  min-width: 160px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-2)) 60%, transparent);
  border: 1px solid var(--dsw-alias-border-l2);
  color: inherit;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}
.dsh_arch_search::placeholder {
  color: var(--dsw-alias-label-dimmed);
}
.dsh_arch_search:focus {
  border-color: var(--dsw-alias-label-tertiary);
}
.dsh_arch_pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}
.dsh_arch_page_info {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: 0.02em;
}
.dsh_arch_empty {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  padding: 14px 4px;
  line-height: 1.7;
}
.dsh_arch_error {
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  padding: 8px 4px;
}
.dsh_arch_mask {
  position: fixed;
  inset: 0;
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
  pointer-events: auto;
}
.dsh_arch_dialog {
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 16px;
  width: min(820px, 94vw);
  height: min(760px, 92vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--dsw-shadow-lv3);
}
.dsh_arch_dialog_head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  flex: none;
}
.dsh_arch_dialog_title {
  font-size: 14px;
  font-weight: 650;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.dsh_arch_dialog_close {
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 7px;
  font-family: inherit;
}
.dsh_arch_dialog_close:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh_arch_dialog_body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dsh_arch_dialog_foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--dsw-alias-border-l2);
  flex: none;
}
.dsh_arch_foot_note {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  flex: 1;
  line-height: 1.5;
}
.dsh_arch_banner {
  font-size: 12px;
  color: #e8a25a;
  background: color-mix(in srgb, #e8a25a 8%, transparent);
  border: 1px solid color-mix(in srgb, #e8a25a 30%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.6;
}
.dsh_arch_turn {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dsh_arch_turn_divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0;
}
.dsh_arch_turn_divider::before,
.dsh_arch_turn_divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--dsw-alias-border-l2);
}
.dsh_arch_turn_divider span {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--dsw-alias-label-dimmed);
  text-transform: uppercase;
}
.dsh_arch_chat {
  display: flex;
  width: 100%;
}
.dsh_arch_chat_left {
  justify-content: flex-start;
}
.dsh_arch_chat_right {
  justify-content: flex-end;
}
.dsh_arch_bubble {
  max-width: 86%;
  border-radius: 12px;
  padding: 9px 13px;
  font-size: 13px;
  line-height: 1.65;
}
.dsh_arch_bubble_left {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-2)) 55%, transparent);
  border-top-left-radius: 5px;
}
.dsh_arch_bubble_right {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 15%, transparent);
  border-top-right-radius: 5px;
}
.dsh_arch_bubble_head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: 0.03em;
}
.dsh_arch_time {
  font-size: 10px;
  color: var(--dsw-alias-label-dimmed);
}
.dsh_arch_system {
  max-width: 92%;
  width: 100%;
}
.dsh_arch_system details {
  border-left: 2px solid var(--dsw-alias-border-l2);
  padding-left: 10px;
}
.dsh_arch_system summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: 0.03em;
}
.dsh_arch_work {
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 10px;
  padding: 8px 12px;
}
.dsh_arch_work summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  letter-spacing: 0.03em;
}
.dsh_arch_work_body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.dsh_arch_work_msg {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh_arch_work_label {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--dsw-alias-label-dimmed);
  text-transform: uppercase;
}
.dsh_arch_p {
  margin: 3px 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.dsh_arch_h1 { font-size: 16px; font-weight: 700; margin: 8px 0 4px; }
.dsh_arch_h2 { font-size: 14.5px; font-weight: 700; margin: 7px 0 3px; }
.dsh_arch_h3 { font-size: 13.5px; font-weight: 650; margin: 6px 0 3px; }
.dsh_arch_h4 { font-size: 13px; font-weight: 650; margin: 5px 0 2px; }
.dsh_arch_ul,
.dsh_arch_ol {
  margin: 4px 0;
  padding-left: 22px;
}
.dsh_arch_ul li,
.dsh_arch_ol li {
  margin: 2px 0;
}
.dsh_arch_quote {
  border-left: 3px solid var(--dsw-alias-border-l2);
  padding: 2px 10px;
  margin: 5px 0;
  color: var(--dsw-alias-label-secondary);
}
.dsh_arch_table_wrap {
  overflow-x: auto;
  margin: 5px 0;
}
.dsh_arch_table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
.dsh_arch_table th,
.dsh_arch_table td {
  border: 1px solid var(--dsw-alias-border-l2);
  padding: 4px 10px;
  text-align: left;
  vertical-align: top;
}
.dsh_arch_table th {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-2)) 60%, transparent);
  font-weight: 600;
}
.dsh_arch_table tr:nth-child(even) td {
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-2)) 25%, transparent);
}
.dsh_arch_inline_code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 14%, transparent);
  border-radius: 4px;
  padding: 0 4px;
}
.dsh_arch_link {
  color: var(--dsw-alias-state-business-primary);
  text-decoration: none;
}
.dsh_arch_link:hover {
  text-decoration: underline;
}
.dsh_arch_code {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 5px 0;
}
.dsh_arch_code_lang {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--dsw-alias-label-dimmed);
  margin-bottom: 4px;
}
.dsh_arch_code code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
}
.dsh_arch_details {
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
}
.dsh_arch_details summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh_arch_inner {
  font-size: 11.5px;
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap;
  max-height: 220px;
  overflow: auto;
  margin-top: 5px;
}
.dsh_arch_chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 11.5px;
  background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 10%, transparent);
  border-radius: 6px;
  padding: 2px 9px;
  margin: 3px 0;
}
.dsh_arch_chip code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
.dsh_arch_toolcard {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent);
  overflow: hidden;
}
.dsh_arch_toolcard_err {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent);
}
.dsh_arch_toolcard_head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  font-size: 11px;
}
.dsh_arch_toolcard_name {
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 10.5px;
  color: var(--dsw-alias-label-primary);
}
.dsh_arch_toolcard_dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.dsh_arch_dot_ok {
  background: #4cd07d;
}
.dsh_arch_dot_err {
  background: var(--dsw-alias-state-error-primary);
}
.dsh_arch_toolcard_time {
  margin-left: auto;
  font-size: 10px;
  color: var(--dsw-alias-label-dimmed);
}
.dsh_arch_toolcard_cmdline {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 8px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}
.dsh_arch_ps1 {
  color: var(--dsw-alias-state-business-primary);
  opacity: 0.85;
  user-select: none;
}
.dsh_arch_toolcard_cmdline code {
  color: inherit;
  white-space: pre-wrap;
  word-break: break-all;
}
.dsh_arch_toolcard_out_wrap summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  padding: 7px 12px;
  border-top: 1px dashed var(--dsw-alias-border-l2);
  letter-spacing: 0.03em;
}
.dsh_arch_toolcard_out {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 8px 12px 12px;
  margin: 0;
  max-height: 320px;
  overflow: auto;
}
.dsh_arch_toolcard_empty {
  font-size: 11px;
  color: var(--dsw-alias-label-dimmed);
  padding: 7px 12px;
  border-top: 1px dashed var(--dsw-alias-border-l2);
}
`

/**
 * Inject the stylesheet once (stable id; HMR-safe).
 */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
}
