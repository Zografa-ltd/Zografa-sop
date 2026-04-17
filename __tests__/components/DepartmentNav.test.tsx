import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepartmentNav } from '@/components/employee/DepartmentNav'

const departments = [
  { id: 'dept-1', name: 'Продажби' },
  { id: 'dept-2', name: 'Логистика' },
]

describe('DepartmentNav', () => {
  it('renders "Всички" tab first', () => {
    render(<DepartmentNav departments={departments} activeId={null} onSelect={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Всички' })).toBeInTheDocument()
  })

  it('renders all department names', () => {
    render(<DepartmentNav departments={departments} activeId={null} onSelect={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Продажби' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Логистика' })).toBeInTheDocument()
  })

  it('calls onSelect with null when "Всички" clicked', async () => {
    const handleSelect = jest.fn()
    render(<DepartmentNav departments={departments} activeId="dept-1" onSelect={handleSelect} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Всички' }))
    expect(handleSelect).toHaveBeenCalledWith(null)
  })

  it('marks active tab with aria-selected', () => {
    render(<DepartmentNav departments={departments} activeId="dept-1" onSelect={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Продажби' })).toHaveAttribute('aria-selected', 'true')
  })
})
