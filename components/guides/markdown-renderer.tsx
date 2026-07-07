'use client'

import React from 'react'

// ============================================================
// 轻量 Markdown → React 节点解析器
//
// 覆盖：heading(#~######) / 无序列表(-/*) / 有序列表(1.) /
//       表格 |xxx| / 引用块 > / 代码块 ``` / 分隔线 --- /
//       段落（空行分隔）
//
// 行内元素：**粗体** / *斜体* / `行内代码` / [链接](url)
//
// 视觉风格与 guides/[id]/page 中的 itinerary/expense 模块一致：
//   - 圆角半透明卡片
//   - indigo 主色
//   - 胶囊徽章（标题）
//   - 标签胶囊（Tag）
//   - 提示框（TipBox — 用于引用块）
// ============================================================

// -------------------------------- 视觉原子组件 --------------------------------

// 小标题徽章（类似 DayBadge 的简化版）
const SectionHeader: React.FC<{ level: number; children: React.ReactNode }> = ({ level, children }) => {
  // 越小的 # 数字（越高级），字号越大
  const sizes: Record<number, string> = {
    1: 'text-base sm:text-xl',
    2: 'text-sm sm:text-lg',
    3: 'text-xs sm:text-base',
    4: 'text-xs sm:text-sm',
    5: 'text-xs sm:text-sm',
    6: 'text-xs',
  }
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5 mt-1 first:mt-0">
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200/70 dark:border-indigo-700/50 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-400 dark:text-indigo-400 leading-none">
          H{level}
        </span>
      </div>
      <h3 className={`font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight ${sizes[level] || sizes[3]}`}>
        {children}
      </h3>
      <div className="hidden sm:block flex-1 h-px bg-indigo-100 dark:bg-indigo-900/50" />
    </div>
  )
}

// 内容卡片（用于表格、引用块等）
const ContentBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-3 sm:p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 ${className}`}>
    {children}
  </div>
)

// 提示框（用于引用块 >）
const TipBox: React.FC<{ children: React.ReactNode; type?: 'info' | 'warning' }> = ({ children, type = 'info' }) => {
  const typeMap = {
    info: 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    warning:
      'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
  }
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${typeMap[type]}`}>
      <span className="flex-shrink-0 text-sm mt-0.5">{type === 'warning' ? '💡' : 'ℹ️'}</span>
      <div className="text-xs sm:text-sm leading-relaxed flex-1">{children}</div>
    </div>
  )
}

// 自定义分割线
const DividerLine: React.FC = () => (
  <div className="my-4 sm:my-6 flex items-center gap-3">
    <div className="flex-1 h-px bg-indigo-100 dark:bg-indigo-900/40" />
    <span className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 dark:text-indigo-500">•</span>
    <div className="flex-1 h-px bg-indigo-100 dark:bg-indigo-900/40" />
  </div>
)

// -------------------------------- 行内元素解析 --------------------------------

// 解析一段纯文本中的 **粗体**、*斜体*、`code`、[链接](url)
// 注意：用正则递归切分，避免嵌套过深
function renderInline(text: string, keyPrefix = 'i'): React.ReactNode[] {
  if (!text) return []

  const nodes: React.ReactNode[] = []
  let remaining = text
  let i = 0

  // 优先级: 链接 > 行内代码 > 粗体 > 斜体
  const patterns: { regex: RegExp; render: (m: RegExpExecArray, k: string) => React.ReactNode }[] = [
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/,
      render: (m, k) => (
        <a
          key={k}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300/50 dark:decoration-indigo-600/40 underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          {renderInline(m[1], `${k}-t`)}
        </a>
      ),
    },
    {
      regex: /`([^`]+)`/,
      render: (m, k) => (
        <code
          key={k}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-[11px] sm:text-xs font-mono text-indigo-600 dark:text-indigo-300 border border-slate-200/70 dark:border-slate-600/40"
        >
          {m[1]}
        </code>
      ),
    },
    {
      regex: /\*\*([^*]+)\*\*/,
      render: (m, k) => (
        <strong key={k} className="font-semibold text-slate-900 dark:text-slate-100">
          {renderInline(m[1], `${k}-b`)}
        </strong>
      ),
    },
    {
      regex: /\*([^*]+)\*/,
      render: (m, k) => (
        <em key={k} className="italic text-slate-700 dark:text-slate-300">
          {renderInline(m[1], `${k}-e`)}
        </em>
      ),
    },
  ]

  // 贪心：每次找到最左侧的第一个匹配，切开
  let safety = 0
  while (remaining && safety < 100) {
    safety++
    let firstMatch: { index: number; length: number; node: React.ReactNode } | null = null

    for (let p = 0; p < patterns.length; p++) {
      const regex = patterns[p].regex
      const m = regex.exec(remaining)
      if (m && m.index !== undefined) {
        if (!firstMatch || m.index < firstMatch.index) {
          firstMatch = {
            index: m.index,
            length: m[0].length,
            node: patterns[p].render(m, `${keyPrefix}-${p}-${i++}`),
          }
        }
      }
    }

    if (!firstMatch) {
      if (remaining) nodes.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{remaining}</React.Fragment>)
      break
    }

    if (firstMatch.index > 0) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-pre-${i++}`}>{remaining.slice(0, firstMatch.index)}</React.Fragment>
      )
    }
    nodes.push(firstMatch.node)
    remaining = remaining.slice(firstMatch.index + firstMatch.length)
  }

  return nodes
}

// -------------------------------- Block 解析 --------------------------------

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'code'; lang?: string; text: string }

function parseBlocks(markdown: string): Block[] {
  if (!markdown) return []

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // 空行
    if (!line.trim()) {
      i++
      continue
    }

    // Heading: #~######
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() })
      i++
      continue
    }

    // Horizontal rule: --- / *** / ___
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Code block: ```lang ... ```
    const fenceStart = /^\s*```(\w*)\s*$/.exec(line)
    if (fenceStart) {
      const lang = fenceStart[1] || undefined
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++ // 跳过结束 ```
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') })
      continue
    }

    // Table: 首行 |...| 且下一行是 |---|---|
    const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l.trim())
    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const splitRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())

      const header = splitRow(line)
      i += 2 // 跳过 header + separator
      const rows: string[][] = []
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    // Blockquote: > ...
    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ').trim() })
      continue
    }

    // Unordered list: - / * / +
    const ulMatch = /^\s*[-*+]\s+(.+)$/.exec(line)
    if (ulMatch) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list: 1. / 2) ...
    const olMatch = /^\s*\d+[.)]\s+(.+)$/.exec(line)
    if (olMatch) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Paragraph: 连续非空行，直到遇到空行或其他 block 开头
    const paraLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(lines[i]) &&
      !/^\s*```/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ').trim() })
  }

  return blocks
}

// -------------------------------- 主渲染组件 --------------------------------

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const blocks = parseBlocks(content)

  return (
    <div className={`space-y-3 sm:space-y-5 leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm ${className}`}>
      {blocks.map((block, idx) => {
        const key = `b-${idx}`
        switch (block.type) {
          case 'heading':
            return (
              <SectionHeader key={key} level={block.level}>
                {renderInline(block.text, `${key}-t`)}
              </SectionHeader>
            )

          case 'paragraph':
            return (
              <p key={key} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {renderInline(block.text, key)}
              </p>
            )

          case 'ul':
            return (
              <ul key={key} className="space-y-1.5 sm:space-y-2">
                {block.items.map((it, itIdx) => (
                  <li key={`${key}-${itIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="flex-shrink-0 mt-[6px] sm:mt-[7px] w-1.5 h-1.5 rounded-full bg-indigo-400/70 dark:bg-indigo-500/70 ring-2 ring-indigo-100 dark:ring-indigo-900/40" />
                    <span className="flex-1 leading-relaxed text-slate-700 dark:text-slate-300">
                      {renderInline(it, `${key}-li-${itIdx}`)}
                    </span>
                  </li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={key} className="space-y-1.5 sm:space-y-2">
                {block.items.map((it, itIdx) => (
                  <li key={`${key}-${itIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200/70 dark:border-indigo-700/40 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 flex items-center justify-center leading-none mt-[1px]">
                      {itIdx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed text-slate-700 dark:text-slate-300">
                      {renderInline(it, `${key}-li-${itIdx}`)}
                    </span>
                  </li>
                ))}
              </ol>
            )

          case 'table':
            return (
              <ContentBlock key={key} className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-indigo-200/60 dark:border-indigo-800/50">
                      {block.header.map((h, hi) => (
                        <th
                          key={`${key}-th-${hi}`}
                          className="text-left px-2.5 sm:px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide"
                        >
                          {renderInline(h, `${key}-th-${hi}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr
                        key={`${key}-tr-${ri}`}
                        className={ri % 2 === 0 ? 'bg-white/40 dark:bg-slate-900/30' : 'bg-transparent'}
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={`${key}-td-${ri}-${ci}`}
                            className="px-2.5 sm:px-3 py-2 align-top text-slate-700 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-700/30"
                          >
                            {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ContentBlock>
            )

          case 'quote':
            return (
              <TipBox key={key} type="info">
                {renderInline(block.text, `${key}-q`)}
              </TipBox>
            )

          case 'hr':
            return <DividerLine key={key} />

          case 'code':
            return (
              <ContentBlock key={key} className="overflow-x-auto">
                {block.lang && (
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400 font-semibold">
                    {block.lang}
                  </div>
                )}
                <pre className="text-[11px] sm:text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre leading-relaxed">
                  {block.text}
                </pre>
              </ContentBlock>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

export default MarkdownRenderer
