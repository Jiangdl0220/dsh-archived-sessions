/**
 * Lightweight markdown renderer for the archived-sessions transcript:
 * fenced code (with JSON pretty-printing), headings, ordered/unordered
 * lists, blockquotes, tables, and inline bold / code / links. Implemented
 * with createElement only — no third-party markdown dependency.
 */
import { Fragment, type ReactElement } from 'react'

interface InlineSegment {
  type: 'text' | 'bold' | 'code' | 'link'
  text?: string
  label?: string
  href?: string
}

interface MdBlock {
  kind: 'code' | 'heading' | 'list' | 'quote' | 'table' | 'para'
  lang?: string
  text?: string
  level?: number
  ordered?: boolean
  items?: string[]
  header?: string[]
  rows?: string[][]
}

/** Pretty-print text that parses as JSON. */
export function prettyJson(text: string): string {
  const s = String(text ?? '').trim()
  if ((s.startsWith('{') || s.startsWith('[')) && s.length > 1) {
    try {
      return JSON.stringify(JSON.parse(s), null, 2)
    } catch {
      /* keep original */
    }
  }
  return text
}

const inlineRe = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]\n]+]\([^)\n]+\))/g

function inlineSegments(text: string): InlineSegment[] {
  const out: InlineSegment[] = []
  let last = 0
  let match: RegExpExecArray | null = null
  while ((match = inlineRe.exec(text)) !== null) {
    if (match.index > last) out.push({ type: 'text', text: text.slice(last, match.index) })
    const token = match[0]
    if (token.startsWith('**')) {
      out.push({ type: 'bold', text: token.slice(2, -2) })
    } else if (token.startsWith('`')) {
      out.push({ type: 'code', text: token.slice(1, -1) })
    } else {
      const link = token.match(/^\[([^\]]+)]\(([^)]+)\)$/)
      if (link !== null && /^(https?:\/\/|mailto:)/.test(link[2])) {
        out.push({ type: 'link', label: link[1], href: link[2] })
      } else {
        out.push({ type: 'text', text: token })
      }
    }
    last = match.index + token.length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}

function renderInline(text: string, keyBase: string): ReactElement {
  return (
    <Fragment key={keyBase}>
      {inlineSegments(text).map((segment, index) => {
        if (segment.type === 'bold') return <strong key={index}>{segment.text}</strong>
        if (segment.type === 'code') return <code key={index} className="dsh_arch_inline_code">{segment.text}</code>
        if (segment.type === 'link') {
          return <a key={index} className="dsh_arch_link" href={segment.href} target="_blank" rel="noreferrer">{segment.label}</a>
        }
        return <span key={index}>{segment.text}</span>
      })}
    </Fragment>
  )
}

function isTableSep(line: string | undefined): boolean {
  return line !== undefined && /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-')
}

function parseMarkdown(text: string): MdBlock[] {
  const lines = text.split('\n')
  const blocks: MdBlock[] = []
  let index = 0
  const push = (block: MdBlock | null): void => {
    if (block !== null) blocks.push(block)
  }
  while (index < lines.length) {
    const line = lines[index]
    const fence = line.match(/^```([\w+.-]*)/)
    if (fence !== null) {
      const lang = fence[1] ?? ''
      const buffer: string[] = []
      index++
      while (index < lines.length && !/^```/.test(lines[index])) {
        buffer.push(lines[index])
        index++
      }
      index++
      push({ kind: 'code', lang, text: buffer.join('\n') })
      continue
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading !== null) {
      push({ kind: 'heading', level: heading[1].length, text: heading[2] })
      index++
      continue
    }
    if (/^\s*\|/.test(line) && isTableSep(lines[index + 1])) {
      const parseRow = (rowLine: string): string[] => rowLine
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, cellIndex, all) => !(cellIndex === 0 && cell === '') && !(cellIndex === all.length - 1 && cell === ''))
      const header = parseRow(line)
      index += 2
      const rows: string[][] = []
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        rows.push(parseRow(lines[index]))
        index++
      }
      push({ kind: 'table', header, rows })
      continue
    }
    const listItem = line.match(/^\s*([-*+]|\d+\.)\s+(.*)$/)
    if (listItem !== null) {
      const ordered = /\d+\./.test(listItem[1])
      const items = [listItem[2]]
      index++
      while (index < lines.length) {
        const next = lines[index].match(/^\s*([-*+]|\d+\.)\s+(.*)$/)
        if (next === null || /\d+\./.test(next[1]) !== ordered) break
        items.push(next[2])
        index++
      }
      push({ kind: 'list', ordered, items })
      continue
    }
    if (/^\s*>\s?/.test(line)) {
      const buffer: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        buffer.push(lines[index].replace(/^\s*>\s?/, ''))
        index++
      }
      push({ kind: 'quote', text: buffer.join('\n') })
      continue
    }
    if (/^\s*$/.test(line)) {
      index++
      continue
    }
    const paragraph = [line]
    index++
    while (index < lines.length) {
      const next = lines[index]
      if (
        /^\s*$/.test(next)
        || /^```/.test(next)
        || /^#{1,4}\s/.test(next)
        || /^\s*([-*+]|\d+\.)\s+/.test(next)
        || /^\s*>\s?/.test(next)
        || (/^\s*\|/.test(next) && isTableSep(lines[index + 1]))
      ) break
      paragraph.push(next)
      index++
    }
    push({ kind: 'para', text: paragraph.join('\n') })
  }
  return blocks
}

/** Render one text block as markdown-lite elements. */
export function RichText({ text }: { text: string }): ReactElement {
  const blocks = parseMarkdown(text)
  return (
    <div>
      {blocks.map((block, index) => {
        if (block.kind === 'code') {
          return (
            <pre key={index} className="dsh_arch_code">
              {block.lang !== undefined && block.lang !== '' ? <div className="dsh_arch_code_lang">{block.lang}</div> : null}
              <code>{prettyJson(block.text ?? '')}</code>
            </pre>
          )
        }
        if (block.kind === 'heading') {
          return <div key={index} className={`dsh_arch_h${block.level ?? 1}`}>{renderInline(block.text ?? '', `h${index}`)}</div>
        }
        if (block.kind === 'list') {
          const Tag = block.ordered === true ? 'ol' : 'ul'
          return (
            <Tag key={index} className={block.ordered === true ? 'dsh_arch_ol' : 'dsh_arch_ul'}>
              {(block.items ?? []).map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `li${itemIndex}`)}</li>
              ))}
            </Tag>
          )
        }
        if (block.kind === 'quote') {
          return <blockquote key={index} className="dsh_arch_quote">{renderInline(block.text ?? '', `q${index}`)}</blockquote>
        }
        if (block.kind === 'table') {
          return (
            <div key={index} className="dsh_arch_table_wrap">
              <table className="dsh_arch_table">
                <thead>
                  <tr>
                    {(block.header ?? []).map((cell, cellIndex) => (
                      <th key={cellIndex}>{renderInline(cell, `th${cellIndex}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(block.rows ?? []).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{renderInline(cell, `td${rowIndex}-${cellIndex}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return <p key={index} className="dsh_arch_p">{renderInline(block.text ?? '', `p${index}`)}</p>
      })}
    </div>
  )
}
