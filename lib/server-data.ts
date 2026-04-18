import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase'
import type { Department, DocumentSummary, ProductModel, SidebarData } from '@/lib/documents'

// React cache() — called by both layout.tsx and page.tsx, fires only once per request
export const getSidebarData = cache(async (): Promise<SidebarData> => {
  const supabase = await createSupabaseServerClient()

  const [{ data: depts }, { data: models }, { data: rawDocs }] = await Promise.all([
    supabase.from('departments').select('id, display_name, sort_order').order('sort_order'),
    supabase.from('product_models').select('id, department_id, name, code, sort_order').order('sort_order'),
    supabase
      .from('documents')
      .select('id, title, type, updated_at, department_id, product_model_id, departments(display_name)')
      .eq('status', 'published')
      .order('title'),
  ])

  const departments: Department[] = (depts ?? []).map((d: any) => ({
    id: d.id,
    name: d.display_name,
    sort_order: d.sort_order ?? 0,
  }))

  const productModels: ProductModel[] = (models ?? []).map((m: any) => ({
    id: m.id,
    department_id: m.department_id,
    name: m.name,
    code: m.code,
    sort_order: m.sort_order ?? 0,
  }))

  const documents: DocumentSummary[] = (rawDocs ?? []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    document_type: doc.type,
    updated_at: doc.updated_at,
    department_id: doc.department_id,
    department_name: (doc.departments as any)?.display_name ?? '',
    product_model_id: doc.product_model_id ?? null,
  }))

  return { departments, productModels, documents }
})
