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

type DomainVerifiedEmailProps = {
  hostname: string
  dashboardUrl: string
}

export const DomainVerifiedEmail = ({ hostname, dashboardUrl }: DomainVerifiedEmailProps) => (
  <Html>
    <Head />
    <Preview>{hostname} is now verified</Preview>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-md px-6 py-12">
          <Heading className="text-xl font-semibold text-neutral-900">
            {hostname} is verified 🎉
          </Heading>
          <Text className="text-sm leading-6 text-neutral-600">
            Ownership of <span className="font-medium text-neutral-900">{hostname}</span> is
            proven. We will keep re-checking the record periodically, so leave the TXT record
            in place to stay verified.
          </Text>
          <Section className="py-4">
            <Button
              href={dashboardUrl}
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              View domain
            </Button>
          </Section>
          <Text className="text-xs leading-5 text-neutral-400">
            If the record ever disappears, we will email you before the domain loses its
            verified status.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
