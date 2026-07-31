import type { ApiMethod } from '@/lib/domains/api-snippets'
import {
  CREATE_DOMAIN_EXAMPLE,
  GET_DOMAIN_EXAMPLE,
  LIST_DOMAINS_EXAMPLE,
  REGENERATE_DOMAIN_EXAMPLE,
  RESTART_DOMAIN_EXAMPLE,
  VERIFY_DOMAIN_EXAMPLE,
} from './api-examples'

export type EndpointField = {
  name: string
  type: string
  required: boolean
  description: string
}

export type EndpointError = {
  status: number
  code: string
  description: string
}

export type EndpointDoc = {
  slug: string
  operationKey: string
  title: string
  method: ApiMethod
  path: string
  description: string[]
  pathParams: EndpointField[]
  bodyParams: EndpointField[]
  responseStatus: number
  responseDescription: string
  responseExample: string | null
  errors: EndpointError[]
}

const UNAUTHORIZED_ERROR: EndpointError = {
  status: 401,
  code: 'unauthorized',
  description: 'The request carried no valid API key.',
}

const NOT_FOUND_ERROR: EndpointError = {
  status: 404,
  code: 'not_found',
  description: 'No domain with this id belongs to your account.',
}

const ID_PATH_PARAM: EndpointField = {
  name: 'id',
  type: 'string',
  required: true,
  description:
    'The domain id returned when the domain was created. Ids are scoped to your account: another user’s id behaves as if it does not exist.',
}

export const ENDPOINT_DOCS: readonly EndpointDoc[] = [
  {
    slug: 'list-domains',
    responseStatus: 200,
    operationKey: 'list',
    title: 'List domains',
    method: 'GET',
    path: '/api/domains',
    description: [
      'Returns every domain on your account, newest first. Each entry is the full domain object, including its current status, the active verification token, and the timestamps that drive the 72-hour windows.',
      'This endpoint never triggers a DNS check. To get fresh check results for one domain, use Get domain (which re-checks stale domains) or Verify domain (which always checks).',
    ],
    pathParams: [],
    bodyParams: [],
    responseDescription: 'An object with a domains array. The array is empty if you have not added any domains yet.',
    responseExample: LIST_DOMAINS_EXAMPLE,
    errors: [UNAUTHORIZED_ERROR],
  },
  {
    slug: 'create-domain',
    responseStatus: 201,
    operationKey: 'create',
    title: 'Create domain',
    method: 'POST',
    path: '/api/domains',
    description: [
      'Adds a domain to your account and starts the 72-hour verification window. The input goes through the same normalization as the dashboard form: full URLs are accepted, the hostname is lowercased, and a trailing dot is stripped.',
      'The response includes the challenge host and verification token you need to build the TXT record, and the first automatic check is scheduled about a minute out. Domainify also tries to detect your DNS provider from the domain’s nameservers and stores it as dnsProviderId.',
    ],
    pathParams: [],
    bodyParams: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description:
          'The domain to claim, as a bare hostname (app.example.com) or a full URL (https://app.example.com/path works too). Apex domains and subdomains are both fine; IP addresses, public suffixes, and hosting-platform subdomains are rejected.',
      },
    ],
    responseDescription: 'Status 201 with the new domain in pending status.',
    responseExample: CREATE_DOMAIN_EXAMPLE,
    errors: [
      UNAUTHORIZED_ERROR,
      {
        status: 422,
        code: 'invalid_body',
        description: 'The body was not JSON shaped like {"name": "example.com"}.',
      },
      {
        status: 422,
        code: 'empty · unparseable · ip_address · public_suffix · platform_suffix · invalid_hostname',
        description:
          'The name failed normalization. The code tells you why and the message is written to be shown to a person. See Authentication & errors for the full table.',
      },
      {
        status: 409,
        code: 'duplicate',
        description: 'This hostname is already on your account.',
      },
    ],
  },
  {
    slug: 'get-domain',
    responseStatus: 200,
    operationKey: 'get',
    title: 'Get domain',
    method: 'GET',
    path: '/api/domains/:id',
    description: [
      'Returns one domain together with its 20 most recent verification checks and the exact TXT record you should place.',
      'Reading has a useful side effect: if the domain is checkable (pending, verified, or temporary_failure) and its last check is older than 2 minutes, Domainify runs a fresh DNS check before answering. A domain you look at is never stale by more than the check itself.',
    ],
    pathParams: [ID_PATH_PARAM],
    bodyParams: [],
    responseDescription:
      'The domain, its recent checks (newest first, up to 20), and the record instructions with the current token.',
    responseExample: GET_DOMAIN_EXAMPLE,
    errors: [UNAUTHORIZED_ERROR, NOT_FOUND_ERROR],
  },
  {
    slug: 'verify-domain',
    responseStatus: 200,
    operationKey: 'verify',
    title: 'Verify domain',
    method: 'POST',
    path: '/api/domains/:id/verify',
    description: [
      'Runs a live DNS check right now and returns both the updated domain and the check that just ran, including the per-source results from your authoritative nameservers, Cloudflare, and Google.',
      'Manual checks are limited to one per domain every 5 seconds. Inside the cooldown you get a 429 with retryAfterMs telling you exactly how long to wait. Automatic background checks keep running regardless.',
    ],
    pathParams: [ID_PATH_PARAM],
    bodyParams: [],
    responseDescription: 'The domain after applying the check result, plus the check itself.',
    responseExample: VERIFY_DOMAIN_EXAMPLE,
    errors: [
      UNAUTHORIZED_ERROR,
      NOT_FOUND_ERROR,
      {
        status: 429,
        code: 'cooldown',
        description:
          'Less than 5 seconds since the last manual check. The response carries a top-level retryAfterMs in milliseconds.',
      },
    ],
  },
  {
    slug: 'restart-verification',
    responseStatus: 200,
    operationKey: 'restart',
    title: 'Restart verification',
    method: 'POST',
    path: '/api/domains/:id/restart',
    description: [
      'Brings a failed domain back to pending. A fresh verification token is minted, a new 72-hour window opens, and checks resume on the usual schedule.',
      'Because the token changes, the old TXT record no longer counts — update the record value at your DNS provider before waiting for verification. This endpoint only works on failed domains; any other status returns a 409.',
    ],
    pathParams: [ID_PATH_PARAM],
    bodyParams: [],
    responseDescription: 'The domain, back in pending with a new token and a new pendingExpiresAt.',
    responseExample: RESTART_DOMAIN_EXAMPLE,
    errors: [
      UNAUTHORIZED_ERROR,
      NOT_FOUND_ERROR,
      {
        status: 409,
        code: 'invalid_state',
        description: 'The domain is not in failed status.',
      },
    ],
  },
  {
    slug: 'regenerate-token',
    responseStatus: 200,
    operationKey: 'regenerate',
    title: 'Regenerate token',
    method: 'POST',
    path: '/api/domains/:id/regenerate',
    description: [
      'Rotates the verification token, for example after the old value leaked or you want to re-prove control. The response includes the updated record instructions with the new value.',
      'A verified domain drops back to pending until the new record is found, so treat this as a deliberate re-verification, not a routine refresh.',
    ],
    pathParams: [ID_PATH_PARAM],
    bodyParams: [],
    responseDescription: 'The domain with its new token, plus record instructions containing the new value.',
    responseExample: REGENERATE_DOMAIN_EXAMPLE,
    errors: [UNAUTHORIZED_ERROR, NOT_FOUND_ERROR],
  },
  {
    slug: 'delete-domain',
    responseStatus: 204,
    operationKey: 'delete',
    title: 'Delete domain',
    method: 'DELETE',
    path: '/api/domains/:id',
    description: [
      'Removes the domain and its entire check history. This cannot be undone.',
      'The TXT record at your DNS provider is yours to clean up — Domainify never touches your zone. You can re-add the same hostname later; it starts over as a new domain with a new token.',
    ],
    pathParams: [ID_PATH_PARAM],
    bodyParams: [],
    responseDescription: 'Status 204 with an empty body.',
    responseExample: null,
    errors: [UNAUTHORIZED_ERROR, NOT_FOUND_ERROR],
  },
] as const

export const findEndpointDoc = (slug: string): EndpointDoc | null =>
  ENDPOINT_DOCS.find((endpoint) => endpoint.slug === slug) ?? null
