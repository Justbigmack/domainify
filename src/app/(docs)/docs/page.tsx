import { DocsArticle, DocsSection } from '@/app/(docs)/docs/_components/DocsArticle'
import { DocsCards } from '@/app/(docs)/docs/_components/DocsCards'
import { DocsCode, DocsLink, DocsOl, DocsP, DocsStrong } from '@/app/(docs)/docs/_components/Prose'

const TOC = [
  { id: 'what-domainify-does', title: 'What Domainify does' },
  { id: 'how-it-works', title: 'How it works' },
  { id: 'explore', title: 'Explore the docs' },
]

const EXPLORE_CARDS = [
  {
    title: 'Domains overview',
    description: 'The challenge record, domain statuses, and the rules for which names you can add.',
    href: '/docs/domains',
  },
  {
    title: 'Add a domain',
    description: 'A step-by-step walkthrough from adding a domain to seeing it verified.',
    href: '/docs/domains/add-a-domain',
  },
  {
    title: 'How verification works',
    description: 'The DNS sources we query, check verdicts, and the status state machine.',
    href: '/docs/domains/verification',
  },
  {
    title: 'API reference',
    description: 'Authentication, error shapes, and every endpoint with ready-to-run snippets.',
    href: '/docs/api',
  },
]

const DocsHomePage = () => (
  <DocsArticle
    title="Domainify documentation"
    lead="Domainify proves you control a domain by asking you to place a single TXT record, then watching DNS until it shows up."
    toc={TOC}
  >
    <DocsSection id="what-domainify-does" title="What Domainify does">
      <DocsP>
        Domain verification answers one question: does the person adding{' '}
        <DocsCode>app.example.com</DocsCode> actually control its DNS? Domainify answers it the same
        way email and hosting providers do — with a challenge record. You add the domain, we hand
        you a unique token, you publish it as a TXT record, and we keep checking until we see it.
      </DocsP>
      <DocsP>
        Everything the dashboard does is also available over{' '}
        <DocsStrong>plain HTTP</DocsStrong>: the UI and the{' '}
        <DocsLink href="/docs/api">API</DocsLink> call the same service functions, so anything you
        can click, you can script.
      </DocsP>
    </DocsSection>
    <DocsSection id="how-it-works" title="How it works">
      <DocsOl>
        <li>
          <DocsStrong>Add a domain.</DocsStrong> Paste a hostname or a full URL. Domainify
          normalizes it, generates a verification token, and opens a 72-hour verification window.
        </li>
        <li>
          <DocsStrong>Place the TXT record.</DocsStrong> Create a record at{' '}
          <DocsCode>_domainify-challenge.&lt;your-domain&gt;</DocsCode> with the value we give you.
          We detect your DNS provider and show its exact field names.
        </li>
        <li>
          <DocsStrong>We spot it.</DocsStrong> Checks run automatically against your authoritative
          nameservers and two public resolvers. The moment they agree the record is there, the
          domain flips to verified — and we keep re-checking daily to make sure it stays true.
        </li>
      </DocsOl>
    </DocsSection>
    <DocsSection id="explore" title="Explore the docs">
      <DocsCards cards={EXPLORE_CARDS} />
    </DocsSection>
  </DocsArticle>
)

export default DocsHomePage
