import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordCard } from './ResetPasswordCard'

const { resetPasswordMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn<() => Promise<{ error: { message: string } | null }>>(),
}))

vi.mock('@/lib/auth/client/authClient', () => ({
  authClient: { resetPassword: resetPasswordMock },
}))

const TOKEN = 'reset-token'
const STRONG_PASSWORD = 'correct-horse-battery'
const SHORT_PASSWORD = 'abc'

const submitPassword = async (password: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText(/^New password/), password)
  await user.click(screen.getByRole('button', { name: 'Update password' }))
}

describe('ResetPasswordCard', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset()
    resetPasswordMock.mockResolvedValue({ error: null })
  })

  it('confirms the change once the password is accepted', async () => {
    render(<ResetPasswordCard token={TOKEN} />)

    await submitPassword(STRONG_PASSWORD)

    expect(resetPasswordMock).toHaveBeenCalledWith({
      newPassword: STRONG_PASSWORD,
      token: TOKEN,
    })
    expect(screen.getByText('Password updated')).toBeInTheDocument()
  })

  it('turns a too-short password away in our own words, without asking the server', async () => {
    render(<ResetPasswordCard token={TOKEN} />)

    await submitPassword(SHORT_PASSWORD)

    expect(resetPasswordMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters.')
  })

  it('names the field the message belongs to', async () => {
    render(<ResetPasswordCard token={TOKEN} />)

    await submitPassword(SHORT_PASSWORD)

    const passwordInput = screen.getByPlaceholderText(/^New password/)
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    expect(passwordInput).toHaveAccessibleDescription('Use at least 8 characters.')
  })

  it('sends a missing token straight to a fresh request', () => {
    render(<ResetPasswordCard token={null} />)

    expect(screen.getByText('This link is invalid or expired')).toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('clears a server failure as soon as the password is edited', async () => {
    const user = userEvent.setup()
    resetPasswordMock.mockResolvedValue({ error: { message: 'That link expired.' } })
    render(<ResetPasswordCard token={TOKEN} />)

    await submitPassword(STRONG_PASSWORD)
    expect(screen.getByRole('alert')).toHaveTextContent('That link expired.')

    await user.type(screen.getByPlaceholderText(/^New password/), 'x')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
