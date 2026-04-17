import { render, screen } from '@testing-library/react'
import { TableOfContents } from '@/components/employee/TableOfContents'

const headings = [
  { id: 'въведение', text: 'Въведение' },
  { id: 'стъпки', text: 'Стъпки' },
  { id: 'отговорности', text: 'Отговорности' },
]

describe('TableOfContents', () => {
  it('renders all heading links', () => {
    render(<TableOfContents headings={headings} />)
    expect(screen.getByRole('link', { name: 'Въведение' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Стъпки' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Отговорности' })).toBeInTheDocument()
  })

  it('each link href matches heading id with hash prefix', () => {
    render(<TableOfContents headings={headings} />)
    expect(screen.getByRole('link', { name: 'Въведение' })).toHaveAttribute('href', '#въведение')
  })

  it('returns null when no headings', () => {
    const { container } = render(<TableOfContents headings={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section title "Съдържание"', () => {
    render(<TableOfContents headings={headings} />)
    expect(screen.getByText('Съдържание')).toBeInTheDocument()
  })
})
