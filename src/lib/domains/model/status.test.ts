import { describe, expect, it } from 'vitest'
import { transitionDomainStatus, verdictToSignal } from './status'

const openContext = { pendingWindowExpired: false, graceWindowExpired: false }
const pendingExpiredContext = { pendingWindowExpired: true, graceWindowExpired: false }
const graceExpiredContext = { pendingWindowExpired: false, graceWindowExpired: true }

describe('transitionDomainStatus', () => {
  it('verifies a pending domain when the record is found', () => {
    expect(transitionDomainStatus('pending', 'found', openContext)).toBe('verified')
  })

  it('keeps a pending domain pending while the window is open', () => {
    expect(transitionDomainStatus('pending', 'missing', openContext)).toBe('pending')
    expect(transitionDomainStatus('pending', 'error', openContext)).toBe('pending')
  })

  it('fails a pending domain only on a confirmed miss after the window expires', () => {
    expect(transitionDomainStatus('pending', 'missing', pendingExpiredContext)).toBe('failed')
    expect(transitionDomainStatus('pending', 'error', pendingExpiredContext)).toBe('pending')
  })

  it('moves a verified domain to temporary_failure when the record disappears', () => {
    expect(transitionDomainStatus('verified', 'missing', openContext)).toBe('temporary_failure')
  })

  it('never demotes a verified domain over a lookup error', () => {
    expect(transitionDomainStatus('verified', 'error', openContext)).toBe('verified')
  })

  it('restores a temporary_failure domain when the record reappears', () => {
    expect(transitionDomainStatus('temporary_failure', 'found', openContext)).toBe('verified')
  })

  it('holds temporary_failure during the grace window', () => {
    expect(transitionDomainStatus('temporary_failure', 'missing', openContext)).toBe(
      'temporary_failure',
    )
    expect(transitionDomainStatus('temporary_failure', 'error', graceExpiredContext)).toBe(
      'temporary_failure',
    )
  })

  it('fails a temporary_failure domain after the grace window expires', () => {
    expect(transitionDomainStatus('temporary_failure', 'missing', graceExpiredContext)).toBe(
      'failed',
    )
  })

  it('keeps failed domains failed until an explicit restart', () => {
    expect(transitionDomainStatus('failed', 'found', openContext)).toBe('failed')
    expect(transitionDomainStatus('failed', 'missing', openContext)).toBe('failed')
  })
})

describe('verdictToSignal', () => {
  it('maps verdicts onto transition signals', () => {
    expect(verdictToSignal('verified')).toBe('found')
    expect(verdictToSignal('no_record')).toBe('missing')
    expect(verdictToSignal('wrong_value')).toBe('missing')
    expect(verdictToSignal('misplaced_record')).toBe('missing')
    expect(verdictToSignal('dns_error')).toBe('error')
  })
})
