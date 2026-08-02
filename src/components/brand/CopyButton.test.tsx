import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyButton } from './CopyButton'

const COPY_FEEDBACK_MS = 1000

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('writes the value to the clipboard and confirms the copy', async () => {
    const user = setupUser()
    render(<CopyButton value="_domainify-challenge.example.com" label="Copy host" />)

    await user.click(screen.getByRole('button', { name: 'Copy host' }))

    await expect(navigator.clipboard.readText()).resolves.toBe(
      '_domainify-challenge.example.com',
    )
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('returns to the idle label after the confirmation window', async () => {
    const user = setupUser()
    render(<CopyButton value="token" label="Copy token" />)

    await user.click(screen.getByRole('button', { name: 'Copy token' }))
    await act(() => vi.advanceTimersByTimeAsync(COPY_FEEDBACK_MS))

    expect(screen.getByRole('button', { name: 'Copy token' })).toBeInTheDocument()
  })
})
