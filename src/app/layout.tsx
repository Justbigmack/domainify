import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/brand/ThemeProvider'
import { SIDEBAR_COLLAPSED_SCRIPT } from '@/components/brand/Sidebar/sidebarCookie'
import { THEME_STORAGE_KEY } from '@/components/brand/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Domainify',
    template: '%s · Domainify',
  },
  description: 'Prove you own a domain with a single DNS record.',
}

const RootLayout = ({ children }: PropsWithChildren) => (
  <html
    lang="en"
    suppressHydrationWarning
    className={`${inter.variable} h-full antialiased`}
  >
    <head>
      <script dangerouslySetInnerHTML={{ __html: SIDEBAR_COLLAPSED_SCRIPT }} />
    </head>
    <body className="min-h-dvh font-sans">
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey={THEME_STORAGE_KEY}
      >
        {children}
      </ThemeProvider>
    </body>
  </html>
)

export default RootLayout
