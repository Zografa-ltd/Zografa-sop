/**
 * @jest-environment node
 */
import { parseDocumentType, extractH2Headings } from '@/lib/documents'

describe('parseDocumentType', () => {
  it('returns "Процес" for type sop', () => {
    expect(parseDocumentType('sop')).toBe('Процес')
  })
  it('returns "Форма" for type form', () => {
    expect(parseDocumentType('form')).toBe('Форма')
  })
  it('returns "Имейл шаблон" for type email_template', () => {
    expect(parseDocumentType('email_template')).toBe('Имейл шаблон')
  })
  it('returns "Задание" for type assignment', () => {
    expect(parseDocumentType('assignment')).toBe('Задание')
  })
  it('returns "Документ" for unknown type', () => {
    expect(parseDocumentType('other')).toBe('Документ')
  })
})

describe('extractH2Headings', () => {
  it('extracts H2 headings from markdown', () => {
    const md = `# Title\n\n## Section One\n\nSome text\n\n## Section Two\n\nMore text`
    expect(extractH2Headings(md)).toEqual([
      { id: 'section-one', text: 'Section One' },
      { id: 'section-two', text: 'Section Two' },
    ])
  })
  it('returns empty array when no H2s', () => {
    expect(extractH2Headings('# Just a title\n\nSome text')).toEqual([])
  })
  it('slugifies Bulgarian text', () => {
    const md = '## Въведение и цел'
    expect(extractH2Headings(md)).toEqual([
      { id: 'въведение-и-цел', text: 'Въведение и цел' },
    ])
  })
})
