import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Зографа — Вътрешни процеси',
    template: '%s | Зографа',
  },
  description: 'Централизирана документна система на ЗОГРАФА ООД',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bg"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
