import { Activity } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignUpCard } from './SignUpCard'

const { signUpEmailMock, pushMock } = vi.hoisted(() => ({
  signUpEmailMock: vi.fn<() => Promise<{ error: { message: string } | null }>>(),
  pushMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

vi.mock('@/lib/auth/client', () => ({
  authClient: { signUp: { email: signUpEmailMock } },
}))

const OWNER_EMAIL = 'new.owner+tag@example.test'

const ActivityHarness = ({ isVisible }: { isVisible: boolean }) => (
  <Activity mode={isVisible ? 'visible' : 'hidden'}>
    <SignUpCard />
  </Activity>
)

const submitSignUp = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Your name'), 'New Owner')
  await user.type(screen.getByPlaceholderText('Enter your email address'), OWNER_EMAIL)
  await user.type(screen.getByPlaceholderText(/^Password/), 'long-enough-password')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('SignUpCard', () => {
  beforeEach(() => {
    signUpEmailMock.mockReset()
    pushMock.mockReset()
    signUpEmailMock.mockResolvedValue({ error: null })
  })

  it('sends a new account to verification rather than straight into the app', async () => {
    render(<SignUpCard />)

    await submitSignUp()

    expect(pushMock).toHaveBeenCalledWith(`/verify-email?email=${encodeURIComponent(OWNER_EMAIL)}`)
  })

  it('never lands on the dashboard before the address is confirmed', async () => {
    render(<SignUpCard />)

    await submitSignUp()

    expect(pushMock).not.toHaveBeenCalledWith('/domains')
  })

  it('keeps the user on the form when sign-up fails', async () => {
    signUpEmailMock.mockResolvedValue({ error: { message: 'Password too short' } })
    render(<SignUpCard />)

    await submitSignUp()

    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Password too short')
  })

  it('comes back idle and empty when the preserved page is shown again', async () => {
    const { rerender } = render(<ActivityHarness isVisible />)

    const nameInput = screen.getByPlaceholderText('Your name')
    const emailInput = screen.getByPlaceholderText('Enter your email address')
    const passwordInput = screen.getByPlaceholderText(/^Password/)
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await submitSignUp()

    rerender(<ActivityHarness isVisible={false} />)
    rerender(<ActivityHarness isVisible />)

    expect(submitButton).not.toHaveAttribute('aria-busy')
    expect(submitButton).not.toBeDisabled()
    expect(nameInput).toHaveValue('')
    expect(emailInput).toHaveValue('')
    expect(passwordInput).toHaveValue('')
  })
})
