import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '@/components/employee/SearchBar'

describe('SearchBar', () => {
  it('renders placeholder text in Bulgarian', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Търси документ...')).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    const handleChange = jest.fn()
    render(<SearchBar value="" onChange={handleChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'процес')
    expect(handleChange).toHaveBeenCalled()
  })
})
