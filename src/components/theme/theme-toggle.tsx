'use client'

import { MoonIcon, SunIcon } from '@/components/icons'

const THEME_STORAGE_KEY = 'domainify-theme'

export const ThemeToggle = () => {
  const handleToggle = () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      return
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle color theme"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </button>
  )
}
