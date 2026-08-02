import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VerifyEmailCard } from './VerifyEmailCard'
import { RESEND_COOLDOWN_SECONDS } from '@/lib/auth/client/useResendCooldown'

const { sendVerificationEmailMock } = vi.hoisted(() => ({
  sendVerificationEmailMock: vi.fn<() => Promise<{ error: { message: string } | null }>>(),
}))

vi.mock('@/lib/auth/client/authClient', () => ({
  authClient: { sendVerificationEmail: sendVerificationEmailMock },
}))

const OWNER_EMAIL = 'owner@example.test'
const SECOND_MS = 1000

describe('VerifyEmailCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    sendVerificationEmailMock.mockReset()
    sendVerificationEmailMock.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('names the address the link was sent to', () => {
    render(<VerifyEmailCard email={OWNER_EMAIL} />)

    expect(screen.getByText(OWNER_EMAIL)).toBeInTheDocument()
  })

  it('offers the resend immediately when arriving straight from sign-up', () => {
    render(<VerifyEmailCard email={OWNER_EMAIL} />)

    expect(screen.getByRole('button', { name: 'Resend link' })).toBeEnabled()
  })

  it('arrives already cooling down when sign-in just triggered a send', () => {
    render(<VerifyEmailCard email={OWNER_EMAIL} hasResent />)

    expect(
      screen.getByRole('button', { name: `Resend in ${RESEND_COOLDOWN_SECONDS}s` }),
    ).toBeDisabled()
  })

  it('requests another link for the same address and starts the cooldown', async () => {
    const user = setupUser()
    render(<VerifyEmailCard email={OWNER_EMAIL} />)

    await user.click(screen.getByRole('button', { name: 'Resend link' }))

    expect(sendVerificationEmailMock).toHaveBeenCalledWith({ email: OWNER_EMAIL })
    expect(
      screen.getByRole('button', { name: `Resend in ${RESEND_COOLDOWN_SECONDS}s` }),
    ).toBeDisabled()
  })

  it('re-enables the resend once the cooldown elapses', async () => {
    const user = setupUser()
    render(<VerifyEmailCard email={OWNER_EMAIL} />)

    await user.click(screen.getByRole('button', { name: 'Resend link' }))
    await act(() => vi.advanceTimersByTimeAsync(RESEND_COOLDOWN_SECONDS * SECOND_MS))

    expect(screen.getByRole('button', { name: 'Resend link' })).toBeEnabled()
  })

  it('reports a failed send instead of pretending a link went out', async () => {
    const user = setupUser()
    sendVerificationEmailMock.mockResolvedValue({ error: { message: 'Too many requests' } })
    render(<VerifyEmailCard email={OWNER_EMAIL} />)

    await user.click(screen.getByRole('button', { name: 'Resend link' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Too many requests')
    expect(screen.getByRole('button', { name: 'Resend link' })).toBeEnabled()
  })
})
