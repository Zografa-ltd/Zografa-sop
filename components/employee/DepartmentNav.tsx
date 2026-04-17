'use client'

interface Department {
  id: string
  name: string
}

interface DepartmentNavProps {
  departments: Department[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function DepartmentNav({ departments, activeId, onSelect }: DepartmentNavProps) {
  const tabs = [{ id: null, name: 'Всички' }, ...departments]

  return (
    <nav role="tablist" aria-label="Отдели" className="flex gap-1 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id ?? '__all__'}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
              ${isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {tab.name}
          </button>
        )
      })}
    </nav>
  )
}
