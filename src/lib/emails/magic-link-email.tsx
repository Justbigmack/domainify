import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from 'react-email'

type MagicLinkEmailProps = {
  magicLinkUrl: string
}

export const MagicLinkEmail = ({ magicLinkUrl }: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your sign-in link for Domainify</Preview>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-md px-6 py-12">
          <Heading className="text-xl font-semibold text-neutral-900">
            Sign in to Domainify
          </Heading>
          <Text className="text-sm leading-6 text-neutral-600">
            Click the button below to sign in. This link expires shortly and can only be used
            once.
          </Text>
          <Section className="py-4 text-center">
            <Button
              href={magicLinkUrl}
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              Sign in
            </Button>
          </Section>
          <Text className="text-xs leading-5 text-neutral-400">
            If you did not request this email, you can safely ignore it. No one can sign in
            without this link.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
