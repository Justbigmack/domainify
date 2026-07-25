import { z } from 'zod'
import {
  CLOUDFLARE_DOH_ENDPOINT,
  DNS_RCODE_NAME_ERROR,
  DNS_RCODE_SUCCESS,
  DOH_TIMEOUT_MS,
  GOOGLE_DOH_ENDPOINT,
  TXT_RECORD_TYPE,
} from './constants'
import type { TxtLookup } from './types'

export type DohProvider = 'cloudflare' | 'google'

const dohResponseSchema = z.object({
  Status: z.number(),
  Answer: z
    .array(
      z.object({
        name: z.string(),
        type: z.number(),
        TTL: z.number().optional(),
        data: z.string(),
      }),
    )
    .optional(),
})

const DOH_REQUEST_CONFIG: Record<DohProvider, { endpoint: string; headers: Record<string, string> }> = {
  cloudflare: { endpoint: CLOUDFLARE_DOH_ENDPOINT, headers: { accept: 'application/dns-json' } },
  google: { endpoint: GOOGLE_DOH_ENDPOINT, headers: {} },
}

const QUOTED_SEGMENT_PATTERN = /"([^"]*)"/g

export const parseDohTxtData = (data: string): string => {
  if (!data.includes('"')) {
    return data
  }
  const segments = [...data.matchAll(QUOTED_SEGMENT_PATTERN)].map((match) => match[1])
  return segments.length > 0 ? segments.join('') : data
}

const toLookupErrorCode = (error: unknown): string =>
  error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'FETCH_FAILED'

export const lookupTxtOverDoh = async (name: string, provider: DohProvider): Promise<TxtLookup> => {
  const { endpoint, headers } = DOH_REQUEST_CONFIG[provider]
  const requestUrl = `${endpoint}?name=${encodeURIComponent(name)}&type=TXT`
  try {
    const response = await fetch(requestUrl, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(DOH_TIMEOUT_MS),
    })
    if (!response.ok) {
      return { kind: 'lookup_error', code: `HTTP_${response.status}` }
    }
    const parsed = dohResponseSchema.safeParse(await response.json())
    if (!parsed.success) {
      return { kind: 'lookup_error', code: 'INVALID_RESPONSE' }
    }
    if (parsed.data.Status === DNS_RCODE_NAME_ERROR) {
      return { kind: 'name_not_found' }
    }
    if (parsed.data.Status !== DNS_RCODE_SUCCESS) {
      return { kind: 'lookup_error', code: `RCODE_${parsed.data.Status}` }
    }
    const txtAnswers = (parsed.data.Answer ?? []).filter(
      (answer) => answer.type === TXT_RECORD_TYPE,
    )
    if (txtAnswers.length === 0) {
      return { kind: 'no_records' }
    }
    const ttls = txtAnswers
      .map((answer) => answer.TTL)
      .filter((ttl): ttl is number => typeof ttl === 'number')
    return {
      kind: 'records',
      values: txtAnswers.map((answer) => parseDohTxtData(answer.data)),
      minTtlSeconds: ttls.length > 0 ? Math.min(...ttls) : null,
    }
  } catch (error) {
    return { kind: 'lookup_error', code: toLookupErrorCode(error) }
  }
}
