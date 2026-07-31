import type { ApiMethod } from '@/lib/domains/api-snippets'

export type DocsNavItem = {
  title: string
  href: string
  method?: ApiMethod
}

export type DocsNavGroup = {
  title: string
  items: DocsNavItem[]
}

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    title: 'Getting started',
    items: [{ title: 'Introduction', href: '/docs' }],
  },
  {
    title: 'Domains',
    items: [
      { title: 'Overview', href: '/docs/domains' },
      { title: 'Add a domain', href: '/docs/domains/add-a-domain' },
      { title: 'How verification works', href: '/docs/domains/verification' },
      { title: 'Troubleshooting', href: '/docs/domains/troubleshooting' },
    ],
  },
  {
    title: 'API reference',
    items: [
      { title: 'Authentication & errors', href: '/docs/api' },
      { title: 'List domains', href: '/docs/api/list-domains', method: 'GET' },
      { title: 'Create domain', href: '/docs/api/create-domain', method: 'POST' },
      { title: 'Get domain', href: '/docs/api/get-domain', method: 'GET' },
      { title: 'Verify domain', href: '/docs/api/verify-domain', method: 'POST' },
      { title: 'Restart verification', href: '/docs/api/restart-verification', method: 'POST' },
      { title: 'Regenerate token', href: '/docs/api/regenerate-token', method: 'POST' },
      { title: 'Delete domain', href: '/docs/api/delete-domain', method: 'DELETE' },
    ],
  },
] as const

export const flattenDocsNav = (): DocsNavItem[] => DOCS_NAV.flatMap((group) => group.items)
