-- supabase/schema.sql
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → Paste → Run
-- NOTE: This file is for reference. The actual database is configured via Supabase dashboard.

-- Departments (dynamic — AI can suggest new ones, admin approves)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,           -- 'SALE', 'LOG', 'MKT' (internal — admin/AI only)
  display_name text NOT NULL,          -- 'Продажби' (shown to employees)
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'admin' CHECK (created_by IN ('admin', 'ai_agent'))
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code text UNIQUE,           -- 'SOP_SALE_001' (admin/AI only, not shown to employees)
  title text NOT NULL,                 -- 'Запитвания Рекламни Стелажи' (shown to all)
  type text NOT NULL CHECK (type IN ('sop', 'form', 'email_template', 'assignment')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  current_version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'published', 'archived')),
  content_md text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document versions (full history — every published version is preserved)
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version text NOT NULL,
  content_md text NOT NULL,
  ai_changes_summary text,
  change_description text,
  published_by text,
  published_at timestamptz DEFAULT now()
);

-- Document relations (links between related documents)
CREATE TABLE IF NOT EXISTS document_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  related_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('template_of', 'see_also', 'depends_on')),
  UNIQUE(document_id, related_document_id)
);

-- Full-text search index (Bulgarian language)
CREATE INDEX IF NOT EXISTS documents_search_idx ON documents
  USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content_md, '')));

-- Auto-update updated_at on documents change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial departments
INSERT INTO departments (code, display_name, description, sort_order) VALUES
  ('SALE', 'Продажби',         'Търговски процеси и запитвания', 1),
  ('LOG',  'Логистика',        'Доставка и монтаж',              2),
  ('REK',  'Рекламации',       'Обработка на рекламации',        3),
  ('PROD', 'Производство',     'Производствени процеси',         4),
  ('HR',   'Човешки ресурси',  'HR процеси',                     5),
  ('FIN',  'Финанси',          'Финансови процеси',              6)
ON CONFLICT (code) DO NOTHING;
