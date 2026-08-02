'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ThemePreference } from '@/components/brand/ThemeProvider'

const THEME_OPTIONS = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
] as const

const subscribeToNothing = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export const ThemeSelect = () => {
  const { theme, setTheme } = useTheme()
  const isHydrated = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot)

  const activeTheme = isHydrated ? theme : 'system'
  const selectedOption =
    THEME_OPTIONS.find((option) => option.value === activeTheme) ?? THEME_OPTIONS[0]
  const preference = selectedOption.value

  const handlePreferenceChange = (nextPreference: ThemePreference | null) => {
    if (nextPreference) setTheme(nextPreference)
  }

  return (
    <Select value={preference} onValueChange={handlePreferenceChange}>
      <SelectTrigger aria-label="Theme" className="w-44 bg-card text-muted-foreground">
        <SelectValue>
          <selectedOption.Icon className="size-4" />
          {selectedOption.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="text-muted-foreground">
        <SelectGroup>
          {THEME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <option.Icon className="size-4" />
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
