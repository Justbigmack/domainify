import { Activity } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginCard } from './LoginCard'

const { signInEmailMock, pushMock } = vi.hoisted(() => ({
  signInEmailMock: vi.fn<() => Promise<{ error: { code?: string; message: string } | null }>>(),
  pushMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

vi.mock('@/lib/auth/client', () => ({
  authClient: { signIn: { email: signInEmailMock } },
}))

const OWNER_EMAIL = 'owner@example.test'
const PASSWORD = 'correct-horse'

const submitCredentials = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Enter your email address'), OWNER_EMAIL)
  await user.type(screen.getByPlaceholderText('Password'), PASSWORD)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginCard', () => {
  beforeEach(() => {
    signInEmailMock.mockReset()
    pushMock.mockReset()
    signInEmailMock.mockResolvedValue({ error: null })
  })

  it('sends a verified account to the dashboard', async () => {
    render(<LoginCard />)

    await submitCredentials()

    expect(pushMock).toHaveBeenCalledWith('/domains')
  })

  it('routes an unverified account to the verification page, flagged as already resent', async () => {
    signInEmailMock.mockResolvedValue({
      error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' },
    })
    render(<LoginCard />)

    await submitCredentials()

    expect(pushMock).toHaveBeenCalledWith(
      `/verify-email?email=${encodeURIComponent(OWNER_EMAIL)}&resent=1`,
    )
  })

  it('keeps every other failure inline on the form', async () => {
    signInEmailMock.mockResolvedValue({
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
    })
    render(<LoginCard />)

    await submitCredentials()

    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password')
  })

  it('confirms a completed verification when the callback lands here', () => {
    render(
      <LoginCard
        verificationNotice={{ tone: 'success', message: 'Your email is verified.' }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Your email is verified.')
  })

  it('flags a failed verification callback as an alert', () => {
    render(
      <LoginCard verificationNotice={{ tone: 'error', message: 'That link expired.' }} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('That link expired.')
  })
})
