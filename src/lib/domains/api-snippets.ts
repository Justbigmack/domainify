export type ApiMethod = 'GET' | 'POST' | 'DELETE'

export type ApiSnippetKind = 'curl' | 'fetch'

export type ApiTarget = {
  id: string
  hostname: string
}

export type ApiOperation = {
  key: string
  method: ApiMethod
  path: string
  summary: string
  snippets: Record<ApiSnippetKind, string>
}

const PLACEHOLDER_TARGET: ApiTarget = { id: '<domain-id>', hostname: 'example.com' }

const SECURE_SESSION_COOKIE = '__Secure-better-auth.session_token'
const SESSION_COOKIE = 'better-auth.session_token'

export const sessionCookieName = (origin: string): string =>
  origin.startsWith('https://') ? SECURE_SESSION_COOKIE : SESSION_COOKIE

type SnippetInput = {
  origin: string
  method: ApiMethod
  path: string
  body?: Record<string, string>
}

const buildCurl = ({ origin, method, path, body }: SnippetInput): string => {
  const lines = [
    method === 'GET' ? `curl ${origin}${path} \\` : `curl -X ${method} ${origin}${path} \\`,
  ]
  const cookieSuffix = body ? ' \\' : ''
  lines.push(`  -b '${sessionCookieName(origin)}=<session-token>'${cookieSuffix}`)
  if (body) {
    lines.push(`  -H 'content-type: application/json' \\`)
    lines.push(`  -d '${JSON.stringify(body)}'`)
  }
  return lines.join('\n')
}

const toJsObjectLiteral = (body: Record<string, string>): string => {
  const entries = Object.entries(body).map(([key, value]) => `${key}: '${value}'`)
  return `{ ${entries.join(', ')} }`
}

const buildFetch = ({ method, path, body }: SnippetInput): string => {
  if (method === 'GET') {
    return [`const response = await fetch('${path}')`, 'console.log(await response.json())'].join(
      '\n',
    )
  }
  if (method === 'DELETE') {
    return [
      `const response = await fetch('${path}', { method: 'DELETE' })`,
      'console.log(response.status)',
    ].join('\n')
  }
  if (!body) {
    return [
      `const response = await fetch('${path}', { method: 'POST' })`,
      'console.log(await response.json())',
    ].join('\n')
  }
  return [
    `const response = await fetch('${path}', {`,
    `  method: 'POST',`,
    `  headers: { 'content-type': 'application/json' },`,
    `  body: JSON.stringify(${toJsObjectLiteral(body)}),`,
    '})',
    'console.log(await response.json())',
  ].join('\n')
}

type OperationInput = SnippetInput & {
  key: string
  summary: string
}

const buildOperation = (input: OperationInput): ApiOperation => ({
  key: input.key,
  method: input.method,
  path: input.path,
  summary: input.summary,
  snippets: {
    curl: buildCurl(input),
    fetch: buildFetch(input),
  },
})

const domainOperationInputs = (origin: string, target: ApiTarget): OperationInput[] => [
  {
    key: 'get',
    method: 'GET',
    path: `/api/domains/${target.id}`,
    origin,
    summary:
      'Domain, record instructions, and the latest checks. Reading a stale domain also re-checks it.',
  },
  {
    key: 'verify',
    method: 'POST',
    path: `/api/domains/${target.id}/verify`,
    origin,
    summary:
      'Runs a live DNS check right now. One check per 5 seconds — beyond that you get a 429 with retryAfterMs.',
  },
  {
    key: 'restart',
    method: 'POST',
    path: `/api/domains/${target.id}/restart`,
    origin,
    summary:
      'Failed domains only: mints a fresh token and opens a new 72-hour window. Any other status returns 409.',
  },
  {
    key: 'regenerate',
    method: 'POST',
    path: `/api/domains/${target.id}/regenerate`,
    origin,
    summary:
      'Rotates the record value. A verified domain goes back to pending until the new record is found.',
  },
  {
    key: 'delete',
    method: 'DELETE',
    path: `/api/domains/${target.id}`,
    origin,
    summary: 'Removes the domain and its check history. Returns 204 with no body.',
  },
]

export const buildCollectionOperations = (
  origin: string,
  target: ApiTarget | null,
): ApiOperation[] => {
  const resolvedTarget = target ?? PLACEHOLDER_TARGET
  const inputs: OperationInput[] = [
    {
      key: 'list',
      method: 'GET',
      path: '/api/domains',
      origin,
      summary: 'All your domains, newest first.',
    },
    {
      key: 'create',
      method: 'POST',
      path: '/api/domains',
      origin,
      body: { name: resolvedTarget.hostname },
      summary:
        'Same normalization as the form — a full URL works, and validation errors come back as {error: {code, message}}.',
    },
    ...domainOperationInputs(origin, resolvedTarget),
  ]
  return inputs.map(buildOperation)
}

export const buildDomainOperations = (origin: string, target: ApiTarget): ApiOperation[] =>
  domainOperationInputs(origin, target).map(buildOperation)
