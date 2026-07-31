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

type ResetPasswordEmailProps = {
  resetUrl: string
}

export const ResetPasswordEmail = ({ resetUrl }: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Domainify password</Preview>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-md px-6 py-12">
          <Heading className="text-xl font-semibold text-neutral-900">
            Reset your password
          </Heading>
          <Text className="text-sm leading-6 text-neutral-600">
            Click the button below to choose a new password. This link expires in one hour and
            can only be used once.
          </Text>
          <Section className="py-4 text-center">
            <Button
              href={resetUrl}
              className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              Reset password
            </Button>
          </Section>
          <Text className="text-xs leading-5 text-neutral-400">
            If you did not request a password reset, you can safely ignore this email. Your
            password will not change.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
