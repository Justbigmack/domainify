import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CodeBlock } from '@/app/(docs)/docs/_components/CodeBlock'
import { DocsArticle, DocsSection, DocsSubheading } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsTable } from '@/app/(docs)/docs/_components/DocsTable'
import { EndpointSnippets } from '@/app/(docs)/docs/_components/EndpointSnippets'
import { MethodBadge } from '@/app/(docs)/docs/_components/MethodLabel'
import { ParamList } from '@/app/(docs)/docs/_components/ParamList'
import { DocsCode, DocsP } from '@/app/(docs)/docs/_components/Prose'
import { ENDPOINT_DOCS, findEndpointDoc } from '@/lib/docs/apiReference'

type EndpointPageParams = {
  params: Promise<{ slug: string }>
}

export const generateStaticParams = () =>
  ENDPOINT_DOCS.map((endpoint) => ({ slug: endpoint.slug }))

export const generateMetadata = async ({ params }: EndpointPageParams): Promise<Metadata> => {
  const { slug } = await params
  const endpoint = findEndpointDoc(slug)
  return { title: endpoint ? endpoint.title : 'API reference' }
}

const EndpointPage = async ({ params }: EndpointPageParams) => {
  const { slug } = await params
  const endpoint = findEndpointDoc(slug)
  if (!endpoint) notFound()

  const toc = [
    { id: 'request', title: 'Request' },
    { id: 'response', title: 'Response' },
    { id: 'errors', title: 'Errors' },
  ]

  return (
    <DocsArticle
      title={endpoint.title}
      lead={endpoint.description[0]}
      toc={toc}
      header={
        <div className="flex min-w-0 items-center gap-2 pt-1">
          <MethodBadge method={endpoint.method} />
          <code className="min-w-0 truncate font-mono text-[0.8125rem]" title={endpoint.path}>
            {endpoint.path}
          </code>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {endpoint.description.slice(1).map((paragraph) => (
          <DocsP key={paragraph}>{paragraph}</DocsP>
        ))}
      </div>
      <DocsSection id="request" title="Request">
        <EndpointSnippets operationKey={endpoint.operationKey} />
        {endpoint.pathParams.length > 0 ? (
          <>
            <DocsSubheading>Path parameters</DocsSubheading>
            <ParamList fields={endpoint.pathParams} />
          </>
        ) : null}
        {endpoint.bodyParams.length > 0 ? (
          <>
            <DocsSubheading>Body parameters</DocsSubheading>
            <ParamList fields={endpoint.bodyParams} />
          </>
        ) : null}
      </DocsSection>
      <DocsSection id="response" title="Response">
        <DocsP>{endpoint.responseDescription}</DocsP>
        {endpoint.responseExample ? (
          <CodeBlock
            code={endpoint.responseExample}
            label={`Copy the ${endpoint.title} response example`}
            title={String(endpoint.responseStatus)}
          />
        ) : null}
      </DocsSection>
      <DocsSection id="errors" title="Errors">
        <DocsTable
          columns={['Status', 'Code', 'When']}
          rows={endpoint.errors.map((error) => [
            error.status,
            <DocsCode key={`${error.status}-${error.code}`}>{error.code}</DocsCode>,
            error.description,
          ])}
        />
      </DocsSection>
    </DocsArticle>
  )
}

export default EndpointPage
