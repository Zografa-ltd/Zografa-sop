'use client'

import toast from 'react-hot-toast'

interface CopyButtonProps {
  content: string
}

export function CopyButton({ content }: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Копирано!')
    } catch {
      toast.error('Грешка при копиране')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2
        text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors print:hidden"
      aria-label="Копирай съдържанието"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Копирай съдържанието
    </button>
  )
}
