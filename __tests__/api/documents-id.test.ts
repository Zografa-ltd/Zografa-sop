/**
 * @jest-environment node
 */

const mockSingle = jest.fn()
const mockEqDoc = jest.fn()
const mockRelSelect = jest.fn()
const mockRelEq = jest.fn()

jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (table === 'documents') {
          return {
            select: () => ({ eq: mockEqDoc.mockReturnThis(), single: mockSingle }),
          }
        }
        // document_relations
        return {
          select: mockRelSelect.mockReturnThis(),
          eq: mockRelEq,
        }
      },
    }),
}))

import { GET } from '@/app/api/documents/[id]/route'
import { NextRequest } from 'next/server'

const makeReq = (id: string) =>
  new NextRequest(`http://localhost/api/documents/${id}`)

describe('GET /api/documents/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 404 when document not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    const res = await GET(makeReq('missing'), { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })

  it('returns document with related documents', async () => {
    const fakeDoc = {
      id: 'doc-1',
      title: 'Процес продажба',
      type: 'sop',
      updated_at: '2026-01-01',
      department_id: 'dept-1',
      departments: { display_name: 'Продажби' },
      content_md: '## Стъпки\n\nТекст',
    }
    mockSingle.mockResolvedValueOnce({ data: fakeDoc, error: null })
    mockRelEq.mockResolvedValueOnce({
      data: [{ related_document_id: 'doc-2', documents: { id: 'doc-2', title: 'Форма' } }],
      error: null,
    })

    const res = await GET(makeReq('doc-1'), { params: Promise.resolve({ id: 'doc-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe('Процес продажба')
    expect(body.content).toBe('## Стъпки\n\nТекст')
    expect(body.related_documents).toHaveLength(1)
    expect(body.related_documents[0].title).toBe('Форма')
  })
})
