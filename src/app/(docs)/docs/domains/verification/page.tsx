import type { Metadata } from 'next'
import { Callout } from '@/app/(docs)/docs/_components/Callout'
import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsTable } from '@/app/(docs)/docs/_components/DocsTable'
import { DocsCode, DocsLink, DocsP, DocsStrong, DocsUl } from '@/app/(docs)/docs/_components/Prose'

export const metadata: Metadata = {
  title: 'How verification works',
}

const TOC = [
  { id: 'where-we-look', title: 'Where we look' },
  { id: 'what-counts', title: 'What counts as verified' },
  { id: 'verdicts', title: 'Check verdicts' },
  { id: 'state-machine', title: 'The status state machine' },
  { id: 'scheduling', title: 'Scheduling and caching' },
  { id: 'history', title: 'Check history' },
]

const VerificationPage = () => (
  <DocsArticle
    title="How verification works"
    lead="Every check queries three independent DNS sources, reduces the answers to a single verdict, and feeds that verdict into a small, conservative state machine."
    toc={TOC}
  >
    <DocsSection id="where-we-look" title="Where we look">
      <DocsP>A single check consults up to three sources in parallel, each with a 5-second timeout:</DocsP>
      <DocsTable
        columns={['Source', 'What it is']}
        rows={[
          [
            <DocsCode key="auth">authoritative</DocsCode>,
            'Your domain’s own nameservers, resolved live for the registrable domain and queried directly. This is the source of truth, with no caches in between.',
          ],
          [
            <DocsCode key="cf">doh_cloudflare</DocsCode>,
            'Cloudflare’s 1.1.1.1 resolver over DNS-over-HTTPS. Sees what the public internet sees, including caching.',
          ],
          [
            <DocsCode key="goog">doh_google</DocsCode>,
            'Google’s 8.8.8.8 resolver over DNS-over-HTTPS. A second, independent public view.',
          ],
        ]}
      />
      <DocsP>
        CNAMEs at the challenge host are followed (up to 8 hops), so pointing{' '}
        <DocsCode>_domainify-challenge.app.example.com</DocsCode> at a TXT record hosted elsewhere
        works.
      </DocsP>
    </DocsSection>
    <DocsSection id="what-counts" title="What counts as verified">
      <DocsP>The record counts as found when either of these holds:</DocsP>
      <DocsUl>
        <li>
          <DocsStrong>Authoritative agreement.</DocsStrong> Every authoritative nameserver that
          answered returned the expected value. Disagreement between your own nameservers (for
          example, mid-propagation after a zone change) keeps the domain unverified until they
          converge.
        </li>
        <li>
          <DocsStrong>Public agreement.</DocsStrong> Both Cloudflare and Google independently
          returned the expected value. This covers setups where authoritative servers are
          unreachable from our checker.
        </li>
      </DocsUl>
      <DocsP>
        The expected value is an exact match of{' '}
        <DocsCode>domainify-domain-verification=&lt;token&gt;</DocsCode> for the domain&apos;s
        current token. Unrelated TXT values at the same name are ignored.
      </DocsP>
    </DocsSection>
    <DocsSection id="verdicts" title="Check verdicts">
      <DocsTable
        columns={['Verdict', 'Meaning']}
        rows={[
          [
            <DocsCode key="verified">verified</DocsCode>,
            'The expected value was found under the agreement rules above.',
          ],
          [
            <DocsCode key="no_record">no_record</DocsCode>,
            'The sources answered, but no Domainify record exists at the challenge host yet.',
          ],
          [
            <DocsCode key="wrong_value">wrong_value</DocsCode>,
            'A Domainify record exists but carries a different token, usually a stale record from before a restart or regenerate.',
          ],
          [
            <DocsCode key="misplaced">misplaced_record</DocsCode>,
            'The record was found at a doubled name like _domainify-challenge.app.example.com.example.com, because the DNS provider appended the zone to an already-full host. The checker probes for this case explicitly.',
          ],
          [
            <DocsCode key="dns_error">dns_error</DocsCode>,
            'Every source errored out: nameservers unreachable, timeouts, or lookup failures. The check is inconclusive.',
          ],
        ]}
      />
    </DocsSection>
    <DocsSection id="state-machine" title="The status state machine">
      <DocsP>
        Verdicts reduce to three signals, <DocsStrong>found</DocsStrong>,{' '}
        <DocsStrong>missing</DocsStrong>, and <DocsStrong>error</DocsStrong>, which drive all
        status transitions:
      </DocsP>
      <DocsTable
        columns={['From', 'Signal', 'To']}
        rows={[
          [
            <DocsCode key="a">pending</DocsCode>,
            'found',
            <DocsCode key="a2">verified</DocsCode>,
          ],
          [
            <DocsCode key="b">pending</DocsCode>,
            'missing, 72-hour window expired',
            <DocsCode key="b2">failed</DocsCode>,
          ],
          [
            <DocsCode key="c">verified</DocsCode>,
            'missing',
            <DocsCode key="c2">temporary_failure</DocsCode>,
          ],
          [
            <DocsCode key="d">temporary_failure</DocsCode>,
            'found',
            <DocsCode key="d2">verified</DocsCode>,
          ],
          [
            <DocsCode key="e">temporary_failure</DocsCode>,
            'missing, 72-hour grace expired',
            <DocsCode key="e2">failed</DocsCode>,
          ],
          [
            <DocsCode key="f">failed</DocsCode>,
            'restart (new token)',
            <DocsCode key="f2">pending</DocsCode>,
          ],
        ]}
      />
      <Callout tone="info">
        An <DocsCode>error</DocsCode> signal never moves a domain anywhere. A registrar outage or a
        timeout at a public resolver cannot demote a verified domain. Only a definitive
        &ldquo;the record is not there&rdquo; can.
      </Callout>
    </DocsSection>
    <DocsSection id="scheduling" title="Scheduling and caching">
      <DocsUl>
        <li>
          Automatic checks start about <DocsStrong>60 seconds</DocsStrong> after a domain is added
          and back off by ×1.15 per attempt, capped at <DocsStrong>4 hours</DocsStrong> between
          checks.
        </li>
        <li>
          Verified domains are re-checked every <DocsStrong>24 hours</DocsStrong> to confirm the
          record is still in place.
        </li>
        <li>
          Opening a domain whose last check is older than <DocsStrong>2 minutes</DocsStrong> runs a
          fresh check before the page (or API response) renders.
        </li>
        <li>
          Manual checks are limited to one per domain every <DocsStrong>5 seconds</DocsStrong>; the
          API returns a 429 with <DocsCode>retryAfterMs</DocsCode> inside the cooldown.
        </li>
      </DocsUl>
      <DocsP>
        Public resolvers cache answers up to the record&apos;s TTL, so a{' '}
        <DocsStrong>match at your nameservers</DocsStrong> can coexist with{' '}
        <DocsStrong>stale public resolvers</DocsStrong> for a while. Authoritative agreement alone
        is enough to verify, so this resolves itself without any action from you.
      </DocsP>
    </DocsSection>
    <DocsSection id="history" title="Check history">
      <DocsP>
        Every check is recorded with its trigger (<DocsCode>manual</DocsCode>,{' '}
        <DocsCode>poll</DocsCode>, <DocsCode>cron</DocsCode>, or <DocsCode>on_read</DocsCode>),
        verdict, the values found, and a per-source snapshot.{' '}
        <DocsLink href="/docs/api/get-domain">Get domain</DocsLink> returns the 20 most recent
        checks, so you can read the full history over the API.
      </DocsP>
    </DocsSection>
  </DocsArticle>
)

export default VerificationPage
