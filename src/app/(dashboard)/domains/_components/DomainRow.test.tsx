import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainRow } from './DomainRow'
import type { DomainListItem } from './DomainsTable'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

vi.mock('@/lib/domains/actions', () => ({
  deleteDomainAction: vi.fn(() => Promise.resolve({ ok: true })),
}))

const ITEM: DomainListItem = {
  id: 'dom_1',
  hostname: 'example.test',
  status: 'pending',
  createdAt: '2026-08-01T00:00:00.000Z',
  lastCheckedAt: '2026-08-02T00:00:00.000Z',
  graceExpiresAt: null,
}

const NOW_MS = Date.parse('2026-08-02T01:00:00.000Z')

const renderRow = () =>
  render(
    <table>
      <tbody>
        <DomainRow item={ITEM} nowMs={NOW_MS} />
      </tbody>
    </table>,
  )

describe('DomainRow', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('navigates to the domain when a non-interactive cell is clicked', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByText('Aug 1, 2026'))

    expect(pushMock).toHaveBeenCalledWith('/domains/dom_1')
  })

  it('does not navigate when the row actions button is clicked', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByRole('button', { name: 'Actions for example.test' }))

    expect(pushMock).not.toHaveBeenCalled()
  })

  it('does not anchor a stretched overlay to the row, which Safari cannot position', () => {
    renderRow()

    const row = screen.getByRole('row')
    expect(row.className).not.toMatch(/(^|\s)relative(\s|$)/)
    expect(row.querySelector('[class*="after:inset-0"]')).toBeNull()
  })
})
