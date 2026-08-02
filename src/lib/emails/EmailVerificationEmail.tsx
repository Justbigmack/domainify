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

type EmailVerificationEmailProps = {
  verifyUrl: string
}

export const EmailVerificationEmail = ({ verifyUrl }: EmailVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for domainify</Preview>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-md px-6 py-12">
          <Heading className="text-xl font-semibold text-neutral-900">
            Verify your email address
          </Heading>
          <Text className="text-sm leading-6 text-neutral-600">
            Click the button below to confirm this address and finish creating your domainify
            account. This link expires in one hour.
          </Text>
          <Section className="py-4 text-center">
            <Button
              href={verifyUrl}
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              Verify email address
            </Button>
          </Section>
          <Text className="text-xs leading-5 text-neutral-400">
            If you did not create a domainify account, you can safely ignore this email. No
            account can be used until this address is confirmed.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
