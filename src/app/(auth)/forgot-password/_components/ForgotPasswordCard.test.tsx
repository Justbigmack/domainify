import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordCard } from './ForgotPasswordCard'

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn<() => Promise<{ error: { message: string } | null }>>(),
}))

vi.mock('@/lib/auth/client/authClient', () => ({
  authClient: { requestPasswordReset: requestPasswordResetMock },
}))

const OWNER_EMAIL = 'owner@example.test'
const MALFORMED_EMAIL = 'var@gmaul.123'

const submitEmail = async (emailAddress: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Enter your email address'), emailAddress)
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
}

describe('ForgotPasswordCard', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset()
    requestPasswordResetMock.mockResolvedValue({ error: null })
  })

  it('confirms the inbox once the link is on its way', async () => {
    render(<ForgotPasswordCard />)

    await submitEmail(OWNER_EMAIL)

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: OWNER_EMAIL,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    expect(screen.getByText('Check your inbox')).toBeInTheDocument()
  })

  it('rejects a malformed address in our own words, without asking the server', async () => {
    render(<ForgotPasswordCard />)

    await submitEmail(MALFORMED_EMAIL)

    expect(requestPasswordResetMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address, e.g. you@company.com.',
    )
  })

  it('names the field the message belongs to', async () => {
    render(<ForgotPasswordCard />)

    await submitEmail(MALFORMED_EMAIL)

    const emailInput = screen.getByPlaceholderText('Enter your email address')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(emailInput).toHaveAccessibleDescription(
      'Enter a valid email address, e.g. you@company.com.',
    )
  })

  it('clears a server failure as soon as the address is edited', async () => {
    const user = userEvent.setup()
    requestPasswordResetMock.mockResolvedValue({ error: { message: 'Too many requests' } })
    render(<ForgotPasswordCard />)

    await submitEmail(OWNER_EMAIL)
    expect(screen.getByRole('alert')).toHaveTextContent('Too many requests')

    await user.type(screen.getByPlaceholderText('Enter your email address'), 'x')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
