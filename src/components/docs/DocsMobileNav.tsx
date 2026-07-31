'use client'

import { useState } from 'react'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DocsBackLink } from './DocsBackLink'
import { DocsNavList } from './DocsNavList'

export const DocsMobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClose = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/90 px-6 backdrop-blur md:hidden">
      <DocsBackLink />
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-lg" aria-label="Open docs menu" className="-mr-3" />
          }
        >
          <MenuIcon />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 gap-0 bg-sidebar p-0 motion-reduce:transition-none"
        >
          <SheetTitle className="sr-only">Docs navigation</SheetTitle>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex h-14 shrink-0 items-center px-6">
              <DocsBackLink onNavigate={handleMenuClose} />
            </div>
            <DocsNavList onNavigate={handleMenuClose} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
