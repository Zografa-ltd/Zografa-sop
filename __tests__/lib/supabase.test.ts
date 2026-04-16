import { createSupabaseBrowserClient } from '@/lib/supabase'

// Mock @supabase/ssr to avoid needing real credentials in tests
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({ from: jest.fn() })),
  createServerClient: jest.fn(() => ({ from: jest.fn() })),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}))

describe('createSupabaseBrowserClient', () => {
  it('returns a client object', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    const client = createSupabaseBrowserClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })
})
