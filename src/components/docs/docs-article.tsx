import type { PropsWithChildren, ReactNode } from 'react'
import { DocsPager } from './docs-pager'
import { DocsToc } from './docs-toc'
import type { TocItem } from './docs-toc'

type DocsArticleProps = PropsWithChildren<{
  title: string
  lead: string
  toc?: TocItem[]
  header?: ReactNode
}>

export const DocsArticle = ({ title, lead, toc, header, children }: DocsArticleProps) => (
  <div className="mx-auto flex w-full max-w-5xl gap-14 px-6 py-10 md:px-10 md:py-12">
    <article className="min-w-0 max-w-2xl flex-1">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-2xl leading-9 font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{lead}</p>
        {header}
      </header>
      <div className="flex flex-col gap-10 pt-10">{children}</div>
      <DocsPager />
    </article>
    {toc && toc.length > 0 ? <DocsToc items={toc} /> : null}
  </div>
)

type DocsSectionProps = PropsWithChildren<{
  id: string
  title: string
}>

export const DocsSection = ({ id, title, children }: DocsSectionProps) => (
  <section className="flex flex-col gap-4">
    <h2 id={id} className="scroll-mt-20 text-lg leading-7 font-semibold">
      {title}
    </h2>
    {children}
  </section>
)

export const DocsSubheading = ({ children }: PropsWithChildren) => (
  <h3 className="pt-1 text-sm leading-6 font-medium">{children}</h3>
)
