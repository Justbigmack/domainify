'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { KeyRoundIcon, PanelLeftIcon, SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { MENU_ROW_CLASS } from '@/components/brand/MobileNav'
import { cn } from '@/lib/utils'

const SETTINGS_LINKS = [
  { href: '/settings/general', label: 'General', Icon: SettingsIcon },
  { href: '/settings/api-keys', label: 'API keys', Icon: KeyRoundIcon },
] as const

export const SettingsMobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleMenuClose = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/90 px-6 backdrop-blur md:hidden">
      <BackToAppLink />
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open settings menu"
              className="-mr-3"
            />
          }
        >
          <PanelLeftIcon />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 gap-0 bg-sidebar p-0 motion-reduce:transition-none"
        >
          <SheetTitle className="sr-only">Settings navigation</SheetTitle>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex h-14 shrink-0 items-center px-6">
              <BackToAppLink onNavigate={handleMenuClose} />
            </div>
            <nav aria-label="Settings" className="flex flex-col gap-0.5 px-3 pt-1">
              {SETTINGS_LINKS.map(({ href, label, Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleMenuClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(MENU_ROW_CLASS, {
                      'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
                    })}
                  >
                    <Icon />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
