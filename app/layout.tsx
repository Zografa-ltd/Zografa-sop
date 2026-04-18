import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
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
      className={`${ibmPlexSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  )
}
