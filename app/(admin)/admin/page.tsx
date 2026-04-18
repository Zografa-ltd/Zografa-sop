import { supabaseAdmin } from '@/lib/supabase'
import { DocumentTable } from './components/DocumentTable'
import Link from 'next/link'

async function getAllDocuments() {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('id, internal_code, title, type, status, current_version, updated_at, department_id, departments(display_name)')
    .order('updated_at', { ascending: false })
  return data ?? []
}

export default async function AdminPage() {
  const docs = await getAllDocuments()

  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <div className="px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E2A] mb-1">
              Зографа
            </p>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Admin панел</h1>
            <p className="mt-1 text-sm text-[#6B6660]">
              {docs.length} документа
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/upload"
              className="px-4 py-2 bg-[#C41E2A] text-white text-sm font-medium rounded-lg
                hover:bg-[#A5181F] transition-colors"
            >
              + Качи документ
            </Link>
            <Link
              href="/admin/product-models"
              className="px-4 py-2 border border-[#E4E1DB] text-sm text-[#6B6660] rounded-lg
                hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            >
              Продуктови модели
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border border-[#E4E1DB] text-sm text-[#6B6660] rounded-lg
                hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            >
              Към сайта
            </Link>
          </div>
        </div>

        {/* Table */}
        <DocumentTable documents={docs as any} />
      </div>
    </main>
  )
}
