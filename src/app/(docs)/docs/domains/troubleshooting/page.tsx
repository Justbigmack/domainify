import type { Metadata } from 'next'
import { Callout } from '@/app/(docs)/docs/_components/Callout'
import { CodeBlock } from '@/app/(docs)/docs/_components/CodeBlock'
import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsCode, DocsLink, DocsP, DocsStrong, DocsUl } from '@/app/(docs)/docs/_components/Prose'

export const metadata: Metadata = {
  title: 'Troubleshooting',
}

const TOC = [
  { id: 'doubled-name', title: 'The record name got doubled' },
  { id: 'wrong-token', title: 'Record found, token differs' },
  { id: 'no-record-yet', title: 'Still says no record' },
  { id: 'dns-errors', title: 'We can’t reach your nameservers' },
  { id: 'domain-failed', title: 'The domain failed' },
  { id: 'rate-limited', title: 'Check now is rate limited' },
]

const COMPARE_DIG_SNIPPET = [
  'dig +short NS example.com',
  'dig +short TXT _domainify-challenge.app.example.com @<one-of-those-nameservers>',
  'dig +short TXT _domainify-challenge.app.example.com @1.1.1.1',
].join('\n')

const DOUBLED_DIG_SNIPPET =
  'dig +short TXT _domainify-challenge.app.example.com.example.com'

const TroubleshootingPage = () => (
  <DocsArticle
    title="Troubleshooting"
    lead="Each failure mode domainify can detect, what causes it, and the shortest path back to verified. The domain page diagnoses these automatically; this page is the long-form version."
    toc={TOC}
  >
    <DocsSection id="doubled-name" title="The record name got doubled">
      <DocsP>
        <DocsStrong>Diagnosis:</DocsStrong> <DocsCode>misplaced_record</DocsCode>. The domain page
        says your DNS provider doubled the record name.
      </DocsP>
      <DocsP>
        Most DNS dashboards append your zone to whatever you type in the host field. Pasting the
        full <DocsCode>_domainify-challenge.app.example.com</DocsCode> into such a field creates
        the record at <DocsCode>_domainify-challenge.app.example.com.example.com</DocsCode>{' '}
        instead. domainify probes the doubled name specifically so it can tell you this happened
        rather than reporting a generic miss. You can confirm it yourself:
      </DocsP>
      <CodeBlock code={DOUBLED_DIG_SNIPPET} label="Copy the doubled-name dig command" />
      <DocsP>
        <DocsStrong>Fix:</DocsStrong> edit the record and keep only the zone-relative prefix in the
        host field, for example <DocsCode>_domainify-challenge.app</DocsCode> when your zone is{' '}
        <DocsCode>example.com</DocsCode>. The add flow shows the exact prefix for your provider.
      </DocsP>
    </DocsSection>
    <DocsSection id="wrong-token" title="Record found, token differs">
      <DocsP>
        <DocsStrong>Diagnosis:</DocsStrong> <DocsCode>wrong_value</DocsCode> means a domainify record
        exists at the right name, but its token is not the current one. The domain page shows the
        tail of both values so you can compare them.
      </DocsP>
      <DocsUl>
        <li>
          You <DocsLink href="/docs/api/restart-verification">restarted</DocsLink> or{' '}
          <DocsLink href="/docs/api/regenerate-token">regenerated</DocsLink>, and both mint a new
          token, so the record placed earlier is now stale. Update the record value.
        </li>
        <li>
          The value was retyped instead of copied and a character changed. Re-copy it with the copy
          button.
        </li>
        <li>
          The record belongs to a different domainify domain (or another account) claiming the same
          hostname. Each claim has its own token.
        </li>
      </DocsUl>
      <Callout tone="info">
        Multiple TXT records can coexist at the same name. Adding the new value does not require
        deleting unrelated records. Only stale <DocsCode>domainify-domain-verification</DocsCode>{' '}
        values are worth cleaning up.
      </Callout>
    </DocsSection>
    <DocsSection id="no-record-yet" title="Still says no record">
      <DocsP>
        <DocsStrong>Diagnosis:</DocsStrong> <DocsCode>no_record</DocsCode> means the sources answered
        and genuinely see nothing at the challenge host. In rough order of likelihood:
      </DocsP>
      <DocsUl>
        <li>
          <DocsStrong>Propagation.</DocsStrong> The record was just created and your provider has
          not published it yet, or public resolvers are still serving a cached empty answer (up to
          the TTL). Give it a few minutes; checks continue automatically.
        </li>
        <li>
          <DocsStrong>Wrong zone.</DocsStrong> The record went into a different domain&apos;s zone,
          which is easy to do with multiple domains in one registrar account.
        </li>
        <li>
          <DocsStrong>Typo in the host.</DocsStrong> A missing underscore or a misspelled{' '}
          <DocsCode>_domainify-challenge</DocsCode> label puts the record at a name nobody checks.
        </li>
      </DocsUl>
      <DocsP>Compare what your nameservers say against a public resolver:</DocsP>
      <CodeBlock code={COMPARE_DIG_SNIPPET} label="Copy the comparison dig commands" />
      <DocsP>
        If the first TXT query returns the value but the second does not, it is pure caching.
        domainify will verify as soon as its authoritative checks agree, independent of public
        resolvers.
      </DocsP>
    </DocsSection>
    <DocsSection id="dns-errors" title="We can’t reach your nameservers">
      <DocsP>
        <DocsStrong>Diagnosis:</DocsStrong> <DocsCode>dns_error</DocsCode> means every source errored:
        timeouts, unreachable nameservers, or lookup failures. Typical causes are a registrar
        outage, a just-transferred domain whose NS records are in flux, or a firewall in front of
        self-hosted nameservers.
      </DocsP>
      <DocsP>
        Errors are deliberately inconclusive: they never fail a pending domain&apos;s check
        countdown decision and never demote a verified one. domainify keeps retrying on its normal
        schedule; once the nameservers answer again, the next check produces a real verdict.
      </DocsP>
    </DocsSection>
    <DocsSection id="domain-failed" title="The domain failed">
      <DocsP>
        A domain fails only by running out of time: 72 hours pending without the record being
        found, or 72 hours of grace after a verified domain&apos;s record disappeared. Failed is
        terminal on purpose, so checks stop until you explicitly{' '}
        <DocsStrong>Restart verification</DocsStrong> or regenerate the token.
      </DocsP>
      <DocsP>
        Either one mints a <DocsStrong>new token</DocsStrong> and opens a fresh 72-hour window.
        Because the token changed, update the TXT record&apos;s value before waiting. The old
        record now produces <DocsCode>wrong_value</DocsCode>, which is your confirmation the new
        value has not landed yet.
      </DocsP>
    </DocsSection>
    <DocsSection id="rate-limited" title="Check now is rate limited">
      <DocsP>
        Manual checks are capped at one per domain every 5 seconds; inside the cooldown the API
        returns <DocsCode>429</DocsCode> with <DocsCode>retryAfterMs</DocsCode>. This only limits
        the button and the <DocsLink href="/docs/api/verify-domain">verify endpoint</DocsLink>;
        automatic polling continues regardless, so waiting is always safe.
      </DocsP>
    </DocsSection>
  </DocsArticle>
)

export default TroubleshootingPage
