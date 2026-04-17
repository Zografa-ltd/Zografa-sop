/**
 * @jest-environment node
 */

const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()

jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: () => ({
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        order: mockOrder,
      }),
    }),
}))

import { GET } from '@/app/api/documents/route'
import { NextRequest } from 'next/server'

describe('GET /api/documents', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns published documents as JSON', async () => {
    const fakeData = [
      {
        id: '1',
        title: 'Процес продажба',
        departments: { display_name: 'Продажби' },
        type: 'sop',
        updated_at: '2026-01-01',
        department_id: 'dept-1',
      },
    ]
    mockOrder.mockResolvedValueOnce({ data: fakeData, error: null })

    const req = new NextRequest('http://localhost/api/documents')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Процес продажба')
    expect(body[0].department_name).toBe('Продажби')
  })

  it('filters by department_id when query param provided', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/documents?department_id=abc-123')
    await GET(req)

    expect(mockEq).toHaveBeenCalledWith('department_id', 'abc-123')
  })

  it('returns 500 on DB error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB down' } })

    const req = new NextRequest('http://localhost/api/documents')
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})
