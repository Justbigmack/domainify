import type { PropsWithChildren, ReactNode } from 'react'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import { DocsPager } from './DocsPager'
import { DocsToc } from './DocsToc'
import type { TocItem } from './DocsToc'

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
        <Heading as="h1" className="leading-9 tracking-normal">{title}</Heading>
        <Text className="leading-6 text-muted-foreground">{lead}</Text>
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
    <Heading as="h2" id={id} className="scroll-mt-20 text-lg leading-7 tracking-normal">
      {title}
    </Heading>
    {children}
  </section>
)

export const DocsSubheading = ({ children }: PropsWithChildren) => (
  <Heading as="h3" size="h4" className="pt-1 leading-6">{children}</Heading>
)
