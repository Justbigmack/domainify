import Link from 'next/link'

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
        <span className="text-sm font-medium">{card.title}</span>
        <span className="text-[0.8125rem] leading-5.5 text-muted-foreground">
          {card.description}
        </span>
      </Link>
    ))}
  </div>
)
