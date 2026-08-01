import Link from 'next/link'
import { Text } from '@/components/brand/Text'

type DocsCard = {
  title: string
  description: string
  href: string
}

type DocsCardsProps = {
  cards: DocsCard[]
}

export const DocsCards = ({ cards }: DocsCardsProps) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {cards.map((card) => (
      <Link
        key={card.href}
        href={card.href}
        className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card px-5 py-4 transition-colors outline-none hover:border-border focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Text as="span" className="font-medium">{card.title}</Text>
        <Text as="span" variant="secondary" className="leading-5.5">
          {card.description}
        </Text>
      </Link>
    ))}
  </div>
)
