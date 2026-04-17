export type DocumentType = 'sop' | 'form' | 'email_template' | 'assignment' | string

export interface DocumentSummary {
  id: string
  title: string
  department_id: string
  department_name: string
  document_type: DocumentType
  updated_at: string
}

export interface DocumentFull extends DocumentSummary {
  content: string
  related_documents: { id: string; title: string }[]
}

export interface TocEntry {
  id: string
  text: string
}

export function parseDocumentType(type: DocumentType): string {
  const map: Record<string, string> = {
    sop: 'Процес',
    form: 'Форма',
    email_template: 'Имейл шаблон',
    assignment: 'Задание',
  }
  return map[type] ?? 'Документ'
}

export function extractH2Headings(markdown: string): TocEntry[] {
  const lines = markdown.split('\n')
  const headings: TocEntry[] = []
  for (const line of lines) {
    const match = line.match(/^## (.+)/)
    if (match) {
      const text = match[1].trim()
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0400-\u04FF-]/g, '')
      headings.push({ id, text })
    }
  }
  return headings
}
