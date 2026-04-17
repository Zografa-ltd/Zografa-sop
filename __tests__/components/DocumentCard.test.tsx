import { render, screen } from '@testing-library/react'
import { DocumentCard } from '@/components/employee/DocumentCard'

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
})

const doc = {
  id: 'doc-1',
  title: 'Процес за приемане на поръчка',
  department_name: 'Продажби',
  document_type: 'sop',
  updated_at: '2026-03-15T10:00:00Z',
  department_id: 'dept-1',
}

describe('DocumentCard', () => {
  it('renders document title', () => {
    render(<DocumentCard doc={doc} />)
    expect(screen.getByText('Процес за приемане на поръчка')).toBeInTheDocument()
  })

  it('renders department badge', () => {
    render(<DocumentCard doc={doc} />)
    expect(screen.getByText('Продажби')).toBeInTheDocument()
  })

  it('does NOT show internal codes or version numbers', () => {
    render(<DocumentCard doc={doc} />)
    expect(screen.queryByText(/SOP_/)).not.toBeInTheDocument()
    expect(screen.queryByText(/v\d/)).not.toBeInTheDocument()
  })

  it('renders "Отвори" link to document page', () => {
    render(<DocumentCard doc={doc} />)
    const link = screen.getByRole('link', { name: /Отвори/ })
    expect(link).toHaveAttribute('href', '/documents/doc-1')
  })

  it('renders Print and Copy buttons', () => {
    render(<DocumentCard doc={doc} />)
    expect(screen.getByRole('link', { name: /Печат/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Копирай/ })).toBeInTheDocument()
  })

  it('shows human-readable type label, not raw type string', () => {
    render(<DocumentCard doc={doc} />)
    expect(screen.getByText('Процес')).toBeInTheDocument()
    expect(screen.queryByText('sop')).not.toBeInTheDocument()
  })
})
