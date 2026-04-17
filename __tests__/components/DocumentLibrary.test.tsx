import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentLibrary } from '@/components/employee/DocumentLibrary'

// Mock child components that aren't under test
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>
  }
})

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
})

const departments = [
  { id: 'd1', name: 'Продажби' },
  { id: 'd2', name: 'Логистика' },
]

const documents = [
  { id: '1', title: 'Процес продажба', department_id: 'd1', department_name: 'Продажби', document_type: 'sop', updated_at: '2026-01-01' },
  { id: '2', title: 'Форма поръчка', department_id: 'd1', department_name: 'Продажби', document_type: 'form', updated_at: '2026-01-02' },
  { id: '3', title: 'Доставка инструкции', department_id: 'd2', department_name: 'Логистика', document_type: 'sop', updated_at: '2026-01-03' },
]

describe('DocumentLibrary', () => {
  it('renders all documents initially', () => {
    render(<DocumentLibrary departments={departments} initialDocuments={documents} />)
    expect(screen.getByText('Процес продажба')).toBeInTheDocument()
    expect(screen.getByText('Форма поръчка')).toBeInTheDocument()
    expect(screen.getByText('Доставка инструкции')).toBeInTheDocument()
  })

  it('filters by department tab click', async () => {
    render(<DocumentLibrary departments={departments} initialDocuments={documents} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Логистика' }))
    expect(screen.getByText('Доставка инструкции')).toBeInTheDocument()
    expect(screen.queryByText('Процес продажба')).not.toBeInTheDocument()
  })

  it('filters by search query', async () => {
    render(<DocumentLibrary departments={departments} initialDocuments={documents} />)
    await userEvent.type(screen.getByRole('searchbox'), 'форма')
    expect(screen.getByText('Форма поръчка')).toBeInTheDocument()
    expect(screen.queryByText('Процес продажба')).not.toBeInTheDocument()
  })

  it('filters by document type select', async () => {
    render(<DocumentLibrary departments={departments} initialDocuments={documents} />)
    await userEvent.click(screen.getByRole('button', { name: /Форми/ }))
    expect(screen.getByText('Форма поръчка')).toBeInTheDocument()
    expect(screen.queryByText('Процес продажба')).not.toBeInTheDocument()
  })

  it('shows "Няма намерени документи" when no results', async () => {
    render(<DocumentLibrary departments={departments} initialDocuments={documents} />)
    await userEvent.type(screen.getByRole('searchbox'), 'нещо несъществуващо xyz')
    expect(screen.getByText(/Няма намерени документи/)).toBeInTheDocument()
  })
})
