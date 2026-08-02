import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/app/(docs)/docs/_components/Callout'
import { CodeBlock } from '@/app/(docs)/docs/_components/CodeBlock'
import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsTable } from '@/app/(docs)/docs/_components/DocsTable'
import { MethodLabel } from '@/components/brand/MethodLabel'
import { DocsCode, DocsLink, DocsP, DocsStrong } from '@/app/(docs)/docs/_components/Prose'
import { ENDPOINT_DOCS } from '@/lib/apiSurface/endpoints'
import { COOLDOWN_ERROR_EXAMPLE, ERROR_SHAPE_EXAMPLE } from '@/lib/apiSurface/examples'
import { DOCS_API_ORIGIN } from '@/lib/apiSurface/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'API reference',
}

const TOC = [
  { id: 'base-url', title: 'Base URL and format' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'errors', title: 'Errors' },
  { id: 'rate-limits', title: 'Rate limits' },
  { id: 'endpoints', title: 'Endpoints' },
]

const AUTH_CURL_SNIPPET = [
  `curl ${DOCS_API_ORIGIN}/api/domains \\`,
  "  -H 'Authorization: Bearer <api-key>'",
].join('\n')

const ApiIntroPage = () => (
  <DocsArticle
    title="API reference"
    lead="Everything the dashboard does is plain HTTP against the same service layer. Seven endpoints cover the whole domain lifecycle."
    toc={TOC}
  >
    <DocsSection id="base-url" title="Base URL and format">
      <DocsP>
        All endpoints live under <DocsCode>{DOCS_API_ORIGIN}/api</DocsCode>. Requests and
        responses are JSON; timestamps are ISO 8601 strings in UTC. There is no versioning prefix —
        the API and the UI ship together.
      </DocsP>
    </DocsSection>
    <DocsSection id="authentication" title="Authentication">
      <DocsP>
        The API authenticates with <DocsStrong>API keys</DocsStrong>. Create one under{' '}
        <DocsLink href="/settings/api-keys">Settings → API keys</DocsLink> — keys start with{' '}
        <DocsCode>domainify_</DocsCode> and are shown only once, at creation. Store yours like any
        other secret and pass it in the <DocsCode>Authorization</DocsCode> header:
      </DocsP>
      <CodeBlock code={AUTH_CURL_SNIPPET} label="Copy the authenticated curl example" />
      <DocsP>
        A key grants full access to the domains of the account that created it, and can be revoked
        at any time from the same page. Requests without a valid key get a{' '}
        <DocsCode>401 unauthorized</DocsCode>.
      </DocsP>
      <Callout tone="info">
        Domains are scoped to the account that owns the key. Ids belonging to another account behave
        exactly like ids that do not exist, so a 404 never confirms that a domain exists elsewhere.
      </Callout>
    </DocsSection>
    <DocsSection id="errors" title="Errors">
      <DocsP>Every error has the same shape — a machine-readable code and a human-readable message:</DocsP>
      <CodeBlock code={ERROR_SHAPE_EXAMPLE} label="Copy the error shape example" />
      <DocsTable
        columns={['Status', 'Code', 'When']}
        rows={[
          [401, <DocsCode key="unauthorized">unauthorized</DocsCode>, 'Missing, revoked, or malformed API key.'],
          [404, <DocsCode key="not_found">not_found</DocsCode>, 'No such domain on your account.'],
          [409, <DocsCode key="duplicate">duplicate</DocsCode>, 'The hostname is already on your account.'],
          [409, <DocsCode key="invalid_state">invalid_state</DocsCode>, 'The action does not apply to the domain’s current status (for example, restarting a domain that has not failed).'],
          [422, <DocsCode key="invalid_body">invalid_body</DocsCode>, 'The request body was not the expected JSON shape.'],
          [
            422,
            <DocsCode key="norm">empty · unparseable · ip_address · public_suffix · platform_suffix · invalid_hostname</DocsCode>,
            'The domain name failed normalization; the code says why and the message is safe to show to users.',
          ],
          [429, <DocsCode key="cooldown">cooldown</DocsCode>, 'Manual verify inside the 5-second cooldown.'],
        ]}
      />
      <DocsP>
        The cooldown error additionally carries a top-level <DocsCode>retryAfterMs</DocsCode>:
      </DocsP>
      <CodeBlock code={COOLDOWN_ERROR_EXAMPLE} label="Copy the cooldown error example" />
    </DocsSection>
    <DocsSection id="rate-limits" title="Rate limits">
      <DocsP>
        The only endpoint-specific limit is on manual verification:{' '}
        <DocsStrong>one live check per domain every 5 seconds</DocsStrong>. Automatic background
        checks do not count against it. Sign-in emails are rate limited separately by the auth
        layer.
      </DocsP>
    </DocsSection>
    <DocsSection id="endpoints" title="Endpoints">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {ENDPOINT_DOCS.map((endpoint, index) => (
          <Link
            key={endpoint.slug}
            href={`/docs/api/${endpoint.slug}`}
            className={cn(
              'flex items-center gap-3 px-5 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50',
              { 'border-t border-border/40': index > 0 },
            )}
          >
            <MethodLabel method={endpoint.method} className="w-12 shrink-0" />
            <code className="min-w-0 truncate font-mono text-[0.8125rem]">{endpoint.path}</code>
            <span className="ml-auto hidden text-[0.8125rem] text-muted-foreground sm:block">
              {endpoint.title}
            </span>
          </Link>
        ))}
      </div>
    </DocsSection>
  </DocsArticle>
)

export default ApiIntroPage
