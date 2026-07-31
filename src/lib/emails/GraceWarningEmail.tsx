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

type GraceWarningEmailProps = {
  hostname: string
  deadlineText: string
  dashboardUrl: string
}

export const GraceWarningEmail = ({
  hostname,
  deadlineText,
  dashboardUrl,
}: GraceWarningEmailProps) => (
  <Html>
    <Head />
    <Preview>Action needed: verification record missing for {hostname}</Preview>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-md px-6 py-12">
          <Heading className="text-xl font-semibold text-neutral-900">
            Action needed: record missing for {hostname}
          </Heading>
          <Text className="text-sm leading-6 text-neutral-600">
            <span className="font-medium text-neutral-900">{hostname}</span> was verified, but
            we can no longer find its verification TXT record. Restore the record before{' '}
            <span className="font-medium text-neutral-900">{deadlineText}</span> to keep the
            domain verified.
          </Text>
          <Section className="py-4">
            <Button
              href={dashboardUrl}
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              View record details
            </Button>
          </Section>
          <Text className="text-xs leading-5 text-neutral-400">
            If you removed the record on purpose, you can ignore this email. The domain will
            move to failed status when the grace period ends.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
