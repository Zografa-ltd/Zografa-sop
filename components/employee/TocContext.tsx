'use client'

import { createContext, useContext, useState } from 'react'
import { TocEntry } from '@/lib/documents'

interface TocContextValue {
  headings: TocEntry[]
  setHeadings: (headings: TocEntry[]) => void
}

export const TocContext = createContext<TocContextValue>({
  headings: [],
  setHeadings: () => {},
})

export function TocProvider({ children }: { children: React.ReactNode }) {
  const [headings, setHeadings] = useState<TocEntry[]>([])
  return (
    <TocContext.Provider value={{ headings, setHeadings }}>
      {children}
    </TocContext.Provider>
  )
}

export function useToc() {
  return useContext(TocContext)
}
