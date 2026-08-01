import type { Metadata } from 'next'
import { Callout } from '@/app/(docs)/docs/_components/Callout'
import { CodeBlock } from '@/app/(docs)/docs/_components/CodeBlock'
import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsCards } from '@/app/(docs)/docs/_components/DocsCards'
import { DocsTable } from '@/app/(docs)/docs/_components/DocsTable'
import { DocsCode, DocsLink, DocsP, DocsStrong, DocsUl } from '@/app/(docs)/docs/_components/Prose'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import { DOCS_API_ORIGIN } from '@/lib/docs/constants'

export const metadata: Metadata = {
  title: 'Add a domain',
}

const TOC = [
  { id: 'before-you-start', title: 'Before you start' },
  { id: 'add-the-domain', title: '1. Add the domain' },
  { id: 'open-your-provider', title: '2. Open your DNS provider' },
  { id: 'create-the-record', title: '3. Create the TXT record' },
  { id: 'wait-for-verification', title: '4. Wait for verification' },
  { id: 'check-it-yourself', title: 'Check it yourself' },
  { id: 'next-steps', title: 'Next steps' },
]

const CREATE_CURL_SNIPPET = [
  `curl -X POST ${DOCS_API_ORIGIN}/api/domains \\`,
  "  -H 'Authorization: Bearer <api-key>' \\",
  "  -H 'content-type: application/json' \\",
  '  -d \'{"name":"app.example.com"}\'',
].join('\n')

const DIG_SNIPPET = 'dig +short TXT _domainify-challenge.app.example.com'

const DIG_RESOLVER_SNIPPET = [
  'dig +short TXT _domainify-challenge.app.example.com @1.1.1.1',
  'dig +short TXT _domainify-challenge.app.example.com @8.8.8.8',
].join('\n')

const NEXT_STEP_CARDS = [
  {
    title: 'How verification works',
    description: 'What the checker queries and how verdicts map to statuses.',
    href: '/docs/domains/verification',
  },
  {
    title: 'Troubleshooting',
    description: 'Doubled record names, stale tokens, and other common snags.',
    href: '/docs/domains/troubleshooting',
  },
]

const AddADomainPage = () => (
  <DocsArticle
    title="Add a domain"
    lead="From pasting a hostname to seeing it verified — usually a few minutes, at most 72 hours."
    toc={TOC}
  >
    <DocsSection id="before-you-start" title="Before you start">
      <DocsP>
        You need access to the DNS settings of the domain you are claiming — the dashboard of
        whoever runs its nameservers (Cloudflare, Route 53, your registrar, …). Apex domains and
        subdomains both work: claiming <DocsCode>status.example.com</DocsCode> only requires adding
        one TXT record inside the <DocsCode>example.com</DocsCode> zone, nothing else changes.
      </DocsP>
    </DocsSection>
    <DocsSection id="add-the-domain" title="1. Add the domain">
      <DocsP>
        In the dashboard, press <DocsStrong>Add domain</DocsStrong> and paste the hostname. A full
        URL is fine — <DocsCode>https://app.example.com/some/path</DocsCode> normalizes to{' '}
        <DocsCode>app.example.com</DocsCode>. Or do the same over the API:
      </DocsP>
      <CodeBlock code={CREATE_CURL_SNIPPET} label="Copy the create-domain curl example" />
      <DocsP>Three things happen immediately:</DocsP>
      <DocsUl>
        <li>
          A unique <DocsStrong>verification token</DocsStrong> is generated and a 72-hour
          verification window opens.
        </li>
        <li>
          The first automatic check is scheduled about a minute out, so you do not have to press
          anything for the record to be noticed.
        </li>
        <li>
          Domainify looks up the domain&apos;s nameservers and, when it recognizes them,{' '}
          <DocsStrong>detects your DNS provider</DocsStrong> so the record instructions use your
          provider&apos;s exact field names.
        </li>
      </DocsUl>
    </DocsSection>
    <DocsSection id="open-your-provider" title="2. Open your DNS provider">
      <DocsP>
        The add flow shows your detected provider first, with a link to its dashboard. Every
        provider names the TXT fields differently; this is what the same record is called across
        the providers Domainify recognizes:
      </DocsP>
      <DocsTable
        columns={['Provider', 'Host field', 'Value field']}
        rows={DNS_PROVIDERS.map((provider) => [
          provider.displayName,
          <DocsCode key={`${provider.id}-host`}>{provider.hostFieldName}</DocsCode>,
          <DocsCode key={`${provider.id}-value`}>{provider.valueFieldName}</DocsCode>,
        ])}
      />
      <DocsP>
        If your provider is not in the list, any DNS host that can create TXT records works — the
        record itself is completely standard.
      </DocsP>
    </DocsSection>
    <DocsSection id="create-the-record" title="3. Create the TXT record">
      <DocsP>
        Create a <DocsCode>TXT</DocsCode> record with the host and value shown in the app, and any
        TTL (Auto is fine — a low TTL just means faster detection after edits). For{' '}
        <DocsCode>app.example.com</DocsCode> the full record name is{' '}
        <DocsCode>_domainify-challenge.app.example.com</DocsCode> and the value is{' '}
        <DocsCode>domainify-domain-verification=&lt;token&gt;</DocsCode>.
      </DocsP>
      <Callout tone="warning">
        Most providers append your zone to the host field automatically. If the app shows{' '}
        <DocsCode>_domainify-challenge.app</DocsCode>, paste exactly that — pasting the full
        hostname would create{' '}
        <DocsCode>_domainify-challenge.app.example.com.example.com</DocsCode>, the single most
        common reason verification stalls. Domainify detects this case and calls it out on the
        domain page.
      </Callout>
      <DocsP>
        Copy the value with the copy button rather than retyping it — the token is long, and a
        single wrong character means the record is found but rejected as{' '}
        <DocsCode>wrong_value</DocsCode>. Other TXT records already living at the same name are
        fine; Domainify scans all values and only cares about the one with its prefix.
      </DocsP>
    </DocsSection>
    <DocsSection id="wait-for-verification" title="4. Wait for verification">
      <DocsP>
        Leave the domain page open — it polls every 30 seconds and flips to{' '}
        <DocsStrong>verified</DocsStrong> on its own. Or press{' '}
        <DocsStrong>Check now</DocsStrong> for an immediate check (one per 5 seconds). In the
        background, checks continue on their own schedule regardless of whether anyone is
        watching.
      </DocsP>
      <DocsP>
        Most records are spotted within a couple of minutes. DNS propagation can occasionally take
        longer — public resolvers cache answers up to the record&apos;s TTL — which is why the
        verification window is a generous 72 hours. If the window closes without the record being
        found, the domain fails and can be{' '}
        <DocsLink href="/docs/api/restart-verification">restarted</DocsLink> with a fresh token.
      </DocsP>
    </DocsSection>
    <DocsSection id="check-it-yourself" title="Check it yourself">
      <DocsP>You can see exactly what Domainify sees from any terminal:</DocsP>
      <CodeBlock code={DIG_SNIPPET} label="Copy the dig command" />
      <DocsP>
        If the value shows up here but the domain is still pending, a cached resolver is likely
        serving an old answer. Compare specific resolvers — these are the two public sources
        Domainify cross-checks:
      </DocsP>
      <CodeBlock code={DIG_RESOLVER_SNIPPET} label="Copy the resolver-specific dig commands" />
    </DocsSection>
    <DocsSection id="next-steps" title="Next steps">
      <DocsCards cards={NEXT_STEP_CARDS} />
    </DocsSection>
  </DocsArticle>
)

export default AddADomainPage
