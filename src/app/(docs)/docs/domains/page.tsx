import type { Metadata } from 'next'
import { Callout } from '@/app/(docs)/docs/_components/Callout'
import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsCards } from '@/app/(docs)/docs/_components/DocsCards'
import { DocsTable } from '@/app/(docs)/docs/_components/DocsTable'
import { DocsCode, DocsLink, DocsP, DocsStrong } from '@/app/(docs)/docs/_components/Prose'

export const metadata: Metadata = {
  title: 'Domains overview',
}

const TOC = [
  { id: 'challenge-record', title: 'The challenge record' },
  { id: 'statuses', title: 'Domain statuses' },
  { id: 'which-names', title: 'Which names you can add' },
  { id: 'check-schedule', title: 'How often we check' },
  { id: 'next-steps', title: 'Next steps' },
]

const NEXT_STEP_CARDS = [
  {
    title: 'Add a domain',
    description: 'The full walkthrough, including per-provider field names.',
    href: '/docs/domains/add-a-domain',
  },
  {
    title: 'How verification works',
    description: 'DNS sources, verdicts, and the status state machine in detail.',
    href: '/docs/domains/verification',
  },
]

const DomainsOverviewPage = () => (
  <DocsArticle
    title="Domains"
    lead="A domain in Domainify is a hostname you claim, a TXT record that proves the claim, and a status that tracks whether the proof currently holds."
    toc={TOC}
  >
    <DocsSection id="challenge-record" title="The challenge record">
      <DocsP>
        Every domain gets exactly one DNS record to place. For{' '}
        <DocsCode>app.example.com</DocsCode> it looks like this:
      </DocsP>
      <DocsTable
        columns={['Field', 'Value']}
        rows={[
          ['Type', <DocsCode key="type">TXT</DocsCode>],
          ['Host', <DocsCode key="host">_domainify-challenge.app.example.com</DocsCode>],
          [
            'Value',
            <DocsCode key="value">domainify-domain-verification=&lt;token&gt;</DocsCode>,
          ],
          ['TTL', 'Auto (any value works)'],
        ]}
      />
      <DocsP>
        The host is always the <DocsCode>_domainify-challenge</DocsCode> label in front of the
        hostname you claimed — subdomains included, so claiming a subdomain never requires access
        to the apex zone. The token is 32 random bytes, unique per domain, and minted fresh every
        time verification starts or restarts. Most DNS dashboards only want the zone-relative part
        of the host (for example <DocsCode>_domainify-challenge.app</DocsCode> when your zone is{' '}
        <DocsCode>example.com</DocsCode>); the app shows the right form for your provider.
      </DocsP>
      <Callout tone="info">
        The record has to stay in place. Verification is continuous — if the record disappears
        later, the domain enters a 72-hour grace period and eventually fails.
      </Callout>
    </DocsSection>
    <DocsSection id="statuses" title="Domain statuses">
      <DocsTable
        columns={['Status', 'Meaning']}
        rows={[
          [
            <DocsCode key="pending">pending</DocsCode>,
            'Waiting for the record to appear. The domain has 72 hours from creation (or restart) to verify before it fails.',
          ],
          [
            <DocsCode key="verified">verified</DocsCode>,
            'The record was found and matched. Domainify re-checks about once a day to confirm it is still there.',
          ],
          [
            <DocsCode key="temporary_failure">temporary_failure</DocsCode>,
            'A previously verified domain no longer shows the record. A 72-hour grace window is open; if the record comes back, the domain returns to verified.',
          ],
          [
            <DocsCode key="failed">failed</DocsCode>,
            'The pending window or grace window ran out. Terminal until you explicitly restart verification, which mints a new token.',
          ],
        ]}
      />
      <DocsP>
        Transitions are deliberately conservative. A domain only moves when a check produces a
        definitive answer: <DocsStrong>found</DocsStrong> promotes, a definitive{' '}
        <DocsStrong>missing</DocsStrong> starts or continues the countdown, and a DNS{' '}
        <DocsStrong>error</DocsStrong> never demotes anyone — an outage at your registrar cannot
        fail your domain. The full state machine is on the{' '}
        <DocsLink href="/docs/domains/verification">verification page</DocsLink>.
      </DocsP>
    </DocsSection>
    <DocsSection id="which-names" title="Which names you can add">
      <DocsP>
        Input is forgiving: <DocsCode>https://app.example.com/dashboard?tab=1</DocsCode> and{' '}
        <DocsCode>APP.Example.com.</DocsCode> both normalize to{' '}
        <DocsCode>app.example.com</DocsCode>. Hostnames are lowercased, trailing dots are stripped,
        and anything past the hostname is ignored. Apex domains and subdomains of any depth are
        accepted, up to DNS&apos;s 253-character limit.
      </DocsP>
      <DocsP>Some inputs are rejected because a TXT record could never prove ownership of them:</DocsP>
      <DocsTable
        columns={['Rejected input', 'Why']}
        rows={[
          [
            <DocsCode key="ip">203.0.113.7</DocsCode>,
            'IP addresses have no DNS zone you could place a record in.',
          ],
          [
            <DocsCode key="suffix">com, co.uk</DocsCode>,
            'Public suffixes are registry-operated, not claimable domains.',
          ],
          [
            <DocsCode key="platform">yourapp.vercel.app</DocsCode>,
            'Hosting-platform subdomains resolve through the platform’s DNS, so a record there proves the platform’s control, not yours.',
          ],
          [
            <DocsCode key="invalid">my_app.example.com</DocsCode>,
            'Labels may only contain letters, numbers, and hyphens.',
          ],
        ]}
      />
      <DocsP>
        Each hostname can exist once per account — adding it again returns a{' '}
        <DocsCode>duplicate</DocsCode> error. The exact error codes the API returns are listed in
        the <DocsLink href="/docs/api">API reference</DocsLink>.
      </DocsP>
    </DocsSection>
    <DocsSection id="check-schedule" title="How often we check">
      <DocsTable
        columns={['Trigger', 'When it runs']}
        rows={[
          [
            <DocsCode key="poll">poll / cron</DocsCode>,
            'Automatic. Starts about a minute after the domain is added, backing off gradually (×1.15 per attempt) to a maximum of 4 hours between checks. Verified domains are re-checked every 24 hours.',
          ],
          [
            <DocsCode key="manual">manual</DocsCode>,
            'You pressed Verify now or called the verify endpoint. Limited to one per domain every 5 seconds.',
          ],
          [
            <DocsCode key="on_read">on_read</DocsCode>,
            'You opened a domain (or fetched it via the API) whose last check was more than 2 minutes old. Reading refreshes it.',
          ],
        ]}
      />
      <DocsP>
        Failed domains are never checked automatically —{' '}
        <DocsLink href="/docs/api/restart-verification">restarting verification</DocsLink> is what
        puts them back on the schedule.
      </DocsP>
    </DocsSection>
    <DocsSection id="next-steps" title="Next steps">
      <DocsCards cards={NEXT_STEP_CARDS} />
    </DocsSection>
  </DocsArticle>
)

export default DomainsOverviewPage
