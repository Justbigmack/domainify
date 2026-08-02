import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'

type AuthHeadlineProps = {
  title: string
  description: string
}

export const AuthHeadline = ({ title, description }: AuthHeadlineProps) => (
  <div className="text-center">
    <Heading as="h1" size="h2">
      {title}
    </Heading>
    <Text className="mt-1.5 leading-6 text-muted-foreground">{description}</Text>
  </div>
)
