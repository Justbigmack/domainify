import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem('domainify-theme');var dark=stored?stored==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light'}catch(error){document.documentElement.dataset.theme='light'}})()`

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
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  >
    <head>
      <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
    </head>
    <body className="min-h-dvh bg-canvas font-sans text-ink">{children}</body>
  </html>
)

export default RootLayout
