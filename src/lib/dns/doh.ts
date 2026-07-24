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
        data: z.string(),
      }),
    )
    .optional(),
})

const DOH_REQUEST_CONFIG: Record<DohProvider, { endpoint: string; headers: Record<string, string> }> = {
  cloudflare: { endpoint: CLOUDFLARE_DOH_ENDPOINT, headers: { accept: 'application/dns-json' } },
  google: { endpoint: GOOGLE_DOH_ENDPOINT, headers: {} },
}

export const parseDohTxtData = (data: string): string => {
  const isQuoted = data.length >= 2 && data.startsWith('"') && data.endsWith('"')
  const inner = isQuoted ? data.slice(1, -1) : data
  return inner.split('""').join('')
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
    const values = (parsed.data.Answer ?? [])
      .filter((answer) => answer.type === TXT_RECORD_TYPE)
      .map((answer) => parseDohTxtData(answer.data))
    return values.length > 0 ? { kind: 'records', values } : { kind: 'no_records' }
  } catch (error) {
    return { kind: 'lookup_error', code: toLookupErrorCode(error) }
  }
}
