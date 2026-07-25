export const TXT_LOOKUP_SOURCES = ['authoritative', 'doh_cloudflare', 'doh_google'] as const
export type TxtLookupSource = (typeof TXT_LOOKUP_SOURCES)[number]

export type TxtLookup =
  | { kind: 'records'; values: string[]; minTtlSeconds: number | null }
  | { kind: 'no_records' }
  | { kind: 'name_not_found' }
  | { kind: 'lookup_error'; code: string }

export const CHECK_VERDICTS = ['verified', 'no_record', 'wrong_value', 'misplaced_record', 'dns_error'] as const
export type CheckVerdict = (typeof CHECK_VERDICTS)[number]

export const CHECK_TRIGGERS = ['manual', 'poll', 'cron', 'on_read'] as const
export type CheckTrigger = (typeof CHECK_TRIGGERS)[number]
