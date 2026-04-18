import JSZip from 'jszip'

function szToPx(halfPt: string | number): number {
  return Math.round(parseInt(String(halfPt)) / 2 * 96 / 72)
}

function dxaToPx(dxa: number): number {
  return Math.round((dxa / 1440) * 96)
}

function loadStyleFontSizes(stylesXml: string): Record<string, number> {
  const map: Record<string, number> = {}
  const def = stylesXml.match(/<w:docDefaults\b[\s\S]*?<\/w:docDefaults>/)
  if (def) {
    const sz = def[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) map['__default'] = szToPx(sz[1])
  }
  const re = /<w:style\b[^>]*w:styleId="([^"]+)"([\s\S]*?)<\/w:style>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stylesXml)) !== null) {
    const sz = m[2].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) map[m[1]] = szToPx(sz[1])
  }
  return map
}

function getParaFontSize(pXml: string, styleMap: Record<string, number>): number | null {
  const rRe = /<w:r\b[\s\S]*?<\/w:r>/g
  let m: RegExpExecArray | null
  while ((m = rRe.exec(pXml)) !== null) {
    const sz = m[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) return szToPx(sz[1])
  }
  const pPrM = pXml.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)
  if (pPrM) {
    const sz = pPrM[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) return szToPx(sz[1])
    const styleId = pPrM[0].match(/<w:pStyle\b[^>]*w:val="([^"]+)"/)
    if (styleId && styleMap[styleId[1]]) return styleMap[styleId[1]]
  }
  return styleMap['__default'] ?? null
}

function extractRunText(xml: string): string {
  const texts: string[] = []
  const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) texts.push(m[1])
  return texts.join('')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function extractParagraphText(pXml: string, baseFontSize: number | null): string {
  const parts: string[] = []
  const rRe = /<w:r\b[\s\S]*?<\/w:r>/g
  let rM: RegExpExecArray | null
  while ((rM = rRe.exec(pXml)) !== null) {
    const run = rM[0]
    const hasBoldOn  = /<w:b\s*\/>|<w:bCs\s*\/>|<w:b\s+w:val="(?!false|0)/.test(run)
    const hasBoldOff = /<w:b\s+w:val="(?:false|0)"/.test(run)
    const isBold = hasBoldOn && !hasBoldOff
    const szM = run.match(/<w:sz[^>]*w:val="(\d+)"/)
    const runSz = szM ? szToPx(szM[1]) : null
    const text = esc(extractRunText(run))
    if (!text) continue
    let content = isBold ? `<strong>${text}</strong>` : text
    if (runSz && runSz !== baseFontSize) {
      content = `<span style="font-size:${runSz}px">${content}</span>`
    }
    parts.push(content)
  }
  return parts.join('')
}

function getTcPadding(tcXml: string): string {
  const mar = tcXml.match(/<w:tcMar>([\s\S]*?)<\/w:tcMar>/)
  if (!mar) return ''
  const m = mar[1]
  const get = (side: string) => {
    const r = m.match(new RegExp(`<w:${side}[^>]*w:w="(\\d+)"`))
    return r ? dxaToPx(parseInt(r[1])) : 0
  }
  const top = get('top'), right = get('right'), bottom = get('bottom'), left = get('left')
  if (!top && !right && !bottom && !left) return ''
  return `style="padding:${top}px ${right}px ${bottom}px ${left}px"`
}

function convertParagraph(pXml: string, styleMap: Record<string, number>, inCell = false): string {
  const fontSize = getParaFontSize(pXml, styleMap)
  const mkStyle = (extra = '') => {
    const parts = [fontSize ? `font-size:${fontSize}px` : '', extra].filter(Boolean)
    return parts.length ? ` style="${parts.join(';')}"` : ''
  }

  const shdMatch = pXml.match(/<w:shd[^>]*w:fill="([0-9A-Fa-f]{6})"/)
  if (shdMatch) {
    const fill = shdMatch[1].toUpperCase()
    if (fill !== 'FFFFFF' && fill !== 'AUTO') {
      const text = extractParagraphText(pXml, fontSize).replace(/<\/?strong>/g, '')
      return text.trim() ? `<p class="mf-section-header"${mkStyle()}><strong>${text}</strong></p>` : ''
    }
  }

  const pBdrMatch = pXml.match(/<w:bottom[^>]*w:val="(?!none|nil)[^"]*"[^>]*w:sz="(\d+)"/)
  if (pBdrMatch && parseInt(pBdrMatch[1]) <= 12) {
    const text = extractParagraphText(pXml, fontSize)
    const beforeMatch = pXml.match(/<w:spacing[^>]*w:before="(\d+)"/)
    const before = beforeMatch ? parseInt(beforeMatch[1]) : 120
    const heightPx = Math.max(18, dxaToPx(before) + 8)
    const line = `<div class="mf-line" style="height:${heightPx}px"></div>`
    if (text.trim()) {
      const isRight = /<w:jc w:val="right"/.test(pXml)
      return `<p${mkStyle(isRight ? 'text-align:right' : '')}>${text}</p>${line}`
    }
    return line
  }

  const text = extractParagraphText(pXml, fontSize)
  if (!text.trim()) return inCell ? '' : '<br>'
  const isRight = /<w:jc w:val="right"/.test(pXml)
  return `<p${mkStyle(isRight ? 'text-align:right' : '')}>${text}</p>`
}

function convertCellContent(tcXml: string, styleMap: Record<string, number>): string {
  const parts: string[] = []
  const pRe = /<w:p\b[\s\S]*?<\/w:p>/g
  let pM: RegExpExecArray | null
  while ((pM = pRe.exec(tcXml)) !== null) {
    parts.push(convertParagraph(pM[0], styleMap, true))
  }
  return parts.join('').replace(/(<div class="mf-line"[^>]*><\/div>)+/g, (match) => {
    const last = match.match(/(<div class="mf-line"[^>]*><\/div>)/)
    return last ? last[1] : match
  })
}

function convertTable(tblXml: string, cls: string, styleMap: Record<string, number>): string {
  const rows: string[] = []
  const trRe = /<w:tr\b[\s\S]*?<\/w:tr>/g
  let trM: RegExpExecArray | null
  while ((trM = trRe.exec(tblXml)) !== null) {
    const cells: string[] = []
    const tcRe = /<w:tc\b[\s\S]*?<\/w:tc>/g
    let tcM: RegExpExecArray | null
    while ((tcM = tcRe.exec(trM[0])) !== null) {
      const padding = getTcPadding(tcM[0])
      const cellHtml = convertCellContent(tcM[0], styleMap)
      cells.push(`<td${padding ? ' ' + padding : ''}>${cellHtml}</td>`)
    }
    if (cells.length) rows.push(`<tr>${cells.join('')}</tr>`)
  }
  return rows.length ? `<table class="${cls}"><tbody>${rows.join('')}</tbody></table>` : ''
}

export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)

  const documentXml = await zip.file('word/document.xml')?.async('string') ?? ''
  const stylesXml   = await zip.file('word/styles.xml')?.async('string') ?? ''

  const styleMap = loadStyleFontSizes(stylesXml)

  const body = (
    documentXml.match(/<w:body>([\s\S]*?)<w:sectPr\b/) ||
    documentXml.match(/<w:body>([\s\S]*?)<\/w:body>/)
  )?.[1] ?? ''

  const parts: string[] = []
  let isFirstTable = true

  const blockRe = /(<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>)/g
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(body)) !== null) {
    const el = m[1]
    if (el.startsWith('<w:tbl')) {
      const cls = isFirstTable ? 'mf-header-table' : 'mf-fill-table'
      isFirstTable = false
      const html = convertTable(el, cls, styleMap)
      if (html) parts.push(html)
    } else {
      const html = convertParagraph(el, styleMap)
      if (html) parts.push(html)
    }
  }

  const html = parts.join('\n')
  return html.replace(/(<div class="mf-line" style="height:(\d+)px"><\/div>\n?)+/g, (match) => {
    const total = [...match.matchAll(/height:(\d+)px/g)].reduce((s, m) => s + parseInt(m[1]), 0)
    return `<div class="mf-line" style="height:${total}px"></div>`
  })
}
