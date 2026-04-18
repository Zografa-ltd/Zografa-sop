/**
 * convert-form.mjs
 *
 * Converts a .docx form file to branded HTML for the Zografa SOP app.
 * Parses Word XML directly — preserves structure and fill lines from the document.
 * Applies only app fonts and colors (not Word's).
 *
 * Usage:
 *   node scripts/convert-form.mjs <path-to.docx> <internal_code>
 *
 * Example:
 *   node scripts/convert-form.mjs "Old/докс/TMP_SALE_001A_Въпросник_бланка.docx" TMP_SALE_001A
 */

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
// Load .env.local manually (no dotenv dependency)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── XML helpers ───────────────────────────────────────────────────────────────

function extractXml(docxPath) {
  return execSync(`unzip -p "${docxPath}" word/document.xml`).toString()
}

// DXA (twentieths of a point) → px (96 DPI)
function dxaToPx(dxa) {
  return Math.round((dxa / 1440) * 96)
}

// Half-points → px (96 DPI)
function szToPx(halfPt) {
  return Math.round(parseInt(halfPt) / 2 * 96 / 72)
}

// Style name → font size px map (loaded once per document)
let gStyleMap = {}

// Load paragraph style font sizes from word/styles.xml (incl. docDefaults)
function loadStyleFontSizes(docxPath) {
  try {
    const xml = execSync(`unzip -p "${docxPath}" word/styles.xml`).toString()
    const map = {}
    // Document default size
    const def = xml.match(/<w:docDefaults\b[\s\S]*?<\/w:docDefaults>/)
    if (def) {
      const sz = def[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
      if (sz) map['__default'] = szToPx(sz[1])
    }
    // Each named style
    const re = /<w:style\b[^>]*w:styleId="([^"]+)"([\s\S]*?)<\/w:style>/g
    let m
    while ((m = re.exec(xml)) !== null) {
      const sz = m[2].match(/<w:sz\b[^>]*w:val="(\d+)"/)
      if (sz) map[m[1]] = szToPx(sz[1])
    }
    return map
  } catch { return {} }
}

// Font size: explicit run sz → paragraph mark sz → paragraph style → null
function getParaFontSize(pXml) {
  // 1. First run with explicit w:sz (use \b to avoid matching w:szCs)
  const rRe = /<w:r\b[\s\S]*?<\/w:r>/g
  let m
  while ((m = rRe.exec(pXml)) !== null) {
    const sz = m[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) return szToPx(sz[1])
  }
  // 2. Paragraph mark run properties (pPr/rPr)
  const pPrM = pXml.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)
  if (pPrM) {
    const sz = pPrM[0].match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz) return szToPx(sz[1])
    // 3. Paragraph style lookup
    const styleId = pPrM[0].match(/<w:pStyle\b[^>]*w:val="([^"]+)"/)
    if (styleId && gStyleMap[styleId[1]]) return gStyleMap[styleId[1]]
  }
  // 4. Document default
  return gStyleMap['__default'] ?? null
}

// Extract all text from a run or paragraph's <w:t> elements
function extractRunText(xml) {
  const texts = []
  const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
  let m
  while ((m = re.exec(xml)) !== null) texts.push(m[1])
  return texts.join('')
}

// Escape HTML special chars in text content
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Paragraph converter ───────────────────────────────────────────────────────

function convertParagraph(pXml, inCell = false) {
  const fontSize = getParaFontSize(pXml)
  const mkStyle = (extra = '') => {
    const parts = [fontSize ? `font-size:${fontSize}px` : '', extra].filter(Boolean)
    return parts.length ? ` style="${parts.join(';')}"` : ''
  }

  // ── Section header: paragraph has shaded background (non-white fill) ──
  const shdMatch = pXml.match(/<w:shd[^>]*w:fill="([0-9A-Fa-f]{6})"/)
  if (shdMatch) {
    const fill = shdMatch[1].toUpperCase()
    if (fill !== 'FFFFFF' && fill !== 'AUTO') {
      const text = extractParagraphText(pXml, fontSize).replace(/<\/?strong>/g, '')
      return text.trim() ? `<p class="mf-section-header"${mkStyle()}><strong>${text}</strong></p>` : ''
    }
  }

  // ── Fill line: paragraph has a thin bottom border (sz ≤ 12) ──
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

  // ── Regular paragraph ──
  const text = extractParagraphText(pXml, fontSize)
  if (!text.trim()) return inCell ? '' : '<br>'

  const isRight = /<w:jc w:val="right"/.test(pXml)
  return `<p${mkStyle(isRight ? 'text-align:right' : '')}>${text}</p>`
}

// Build paragraph HTML content from its runs, preserving bold and font size
function extractParagraphText(pXml, baseFontSize = null) {
  const parts = []
  const rRe = /<w:r\b[\s\S]*?<\/w:r>/g
  let rM
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

// ── Table converter ───────────────────────────────────────────────────────────

// Extract w:tcMar as CSS padding string (DXA → px)
function getTcPadding(tcXml) {
  const mar = tcXml.match(/<w:tcMar>([\s\S]*?)<\/w:tcMar>/)
  if (!mar) return ''
  const m = mar[1]
  const get = side => {
    const r = m.match(new RegExp(`<w:${side}[^>]*w:w="(\\d+)"`))
    return r ? dxaToPx(parseInt(r[1])) : 0
  }
  const top = get('top'), right = get('right'), bottom = get('bottom'), left = get('left')
  if (!top && !right && !bottom && !left) return ''
  return `style="padding:${top}px ${right}px ${bottom}px ${left}px"`
}

function convertTable(tblXml, cls) {
  const rows = []
  const trRe = /<w:tr\b[\s\S]*?<\/w:tr>/g
  let trM
  while ((trM = trRe.exec(tblXml)) !== null) {
    const cells = []
    const tcRe = /<w:tc\b[\s\S]*?<\/w:tc>/g
    let tcM
    while ((tcM = tcRe.exec(trM[0])) !== null) {
      const padding = getTcPadding(tcM[0])
      const cellHtml = convertCellContent(tcM[0])
      cells.push(`<td${padding ? ' ' + padding : ''}>${cellHtml}</td>`)
    }
    if (cells.length) rows.push(`<tr>${cells.join('')}</tr>`)
  }
  return rows.length ? `<table class="${cls}"><tbody>${rows.join('')}</tbody></table>` : ''
}

function convertCellContent(tcXml) {
  const parts = []
  const pRe = /<w:p\b[\s\S]*?<\/w:p>/g
  let pM
  while ((pM = pRe.exec(tcXml)) !== null) {
    parts.push(convertParagraph(pM[0], true))
  }
  // Collapse consecutive fill lines (Word cells often have both a bordered label
  // paragraph AND an empty bordered paragraph below — keep only the last one)
  return parts.join('').replace(/(<div class="mf-line"[^>]*><\/div>)+/g, (_, last) => last)
}

// ── Main document converter ───────────────────────────────────────────────────

function docxToFormHtml(docxPath) {
  gStyleMap = loadStyleFontSizes(docxPath)
  const xml = extractXml(docxPath)

  // Extract body (stop before sectPr)
  const body = (
    xml.match(/<w:body>([\s\S]*?)<w:sectPr\b/) ||
    xml.match(/<w:body>([\s\S]*?)<\/w:body>/)
  )?.[1] ?? ''

  const parts = []
  let isFirstTable = true

  // Walk top-level block elements: w:tbl and w:p
  const blockRe = /(<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>)/g
  let m
  while ((m = blockRe.exec(body)) !== null) {
    const el = m[1]
    if (el.startsWith('<w:tbl')) {
      const cls = isFirstTable ? 'mf-header-table' : 'mf-fill-table'
      isFirstTable = false
      const html = convertTable(el, cls)
      if (html) parts.push(html)
    } else {
      const html = convertParagraph(el)
      if (html) parts.push(html)
    }
  }

  // Merge consecutive fill lines into one taller line (Word uses multiple
  // empty bordered paragraphs to create a writing area; HTML renders them stacked)
  const html = parts.join('\n')
  return html.replace(/(<div class="mf-line" style="height:(\d+)px"><\/div>\n?)+/g, (match) => {
    const total = [...match.matchAll(/height:(\d+)px/g)].reduce((s, m) => s + parseInt(m[1]), 0)
    return `<div class="mf-line" style="height:${total}px"></div>`
  })
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

async function main() {
  const [,, docxPath, internalCode] = process.argv
  if (!docxPath || !internalCode) {
    console.error('Usage: node scripts/convert-form.mjs <path-to.docx> <internal_code>')
    process.exit(1)
  }

  console.log(`Converting: ${docxPath}`)
  const html = docxToFormHtml(docxPath)
  console.log('\n=== HTML preview (first 1000 chars) ===')
  console.log(html.slice(0, 1000))
  console.log(`\n=== Total length: ${html.length} chars ===`)

  const { data, error } = await sb
    .from('documents')
    .update({ content_html: html })
    .eq('internal_code', internalCode)
    .select('id, title')

  if (error) {
    console.error('\n❌ Upload error:', error.message)
    process.exit(1)
  }
  console.log(`\n✅ Записано: ${data?.[0]?.title} (${internalCode})`)
}

main().catch(e => { console.error(e); process.exit(1) })
