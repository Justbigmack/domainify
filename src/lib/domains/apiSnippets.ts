export type ApiMethod = 'GET' | 'POST' | 'DELETE'

export type ApiSnippetKind = 'curl' | 'fetch'

export type ApiOperation = {
  key: string
  method: ApiMethod
  path: string
  summary: string
  snippets: Record<ApiSnippetKind, string>
}

const PLACEHOLDER_DOMAIN_ID = '<domain-id>'
const PLACEHOLDER_HOSTNAME = 'example.com'

export const API_KEY_PLACEHOLDER = '<api-key>'

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
  const authSuffix = body ? ' \\' : ''
  lines.push(`  -H 'Authorization: Bearer ${API_KEY_PLACEHOLDER}'${authSuffix}`)
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

const AUTH_HEADER_LITERAL = `authorization: 'Bearer ${API_KEY_PLACEHOLDER}'`

const buildFetch = ({ origin, method, path, body }: SnippetInput): string => {
  const url = `${origin}${path}`
  if (method === 'GET') {
    return [
      `const response = await fetch('${url}', {`,
      `  headers: { ${AUTH_HEADER_LITERAL} },`,
      '})',
      'console.log(await response.json())',
    ].join('\n')
  }
  if (method === 'DELETE') {
    return [
      `const response = await fetch('${url}', {`,
      `  method: 'DELETE',`,
      `  headers: { ${AUTH_HEADER_LITERAL} },`,
      '})',
      'console.log(response.status)',
    ].join('\n')
  }
  if (!body) {
    return [
      `const response = await fetch('${url}', {`,
      `  method: 'POST',`,
      `  headers: { ${AUTH_HEADER_LITERAL} },`,
      '})',
      'console.log(await response.json())',
    ].join('\n')
  }
  return [
    `const response = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: { ${AUTH_HEADER_LITERAL}, 'content-type': 'application/json' },`,
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

const domainOperationInputs = (origin: string, domainId: string): OperationInput[] => [
  {
    key: 'get',
    method: 'GET',
    path: `/api/domains/${domainId}`,
    origin,
    summary:
      'Domain, record instructions, and the latest checks. Reading a stale domain also re-checks it.',
  },
  {
    key: 'verify',
    method: 'POST',
    path: `/api/domains/${domainId}/verify`,
    origin,
    summary:
      'Runs a live DNS check right now. One check per 5 seconds; beyond that you get a 429 with retryAfterMs.',
  },
  {
    key: 'restart',
    method: 'POST',
    path: `/api/domains/${domainId}/restart`,
    origin,
    summary:
      'Failed domains only: mints a fresh token and opens a new 72-hour window. Any other status returns 409.',
  },
  {
    key: 'regenerate',
    method: 'POST',
    path: `/api/domains/${domainId}/regenerate`,
    origin,
    summary:
      'Rotates the record value. The domain goes back to pending with a fresh 72-hour window until the new record is found.',
  },
  {
    key: 'delete',
    method: 'DELETE',
    path: `/api/domains/${domainId}`,
    origin,
    summary: 'Removes the domain and its check history. Returns 204 with no body.',
  },
]

export const buildCollectionOperations = (origin: string): ApiOperation[] => {
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
      body: { name: PLACEHOLDER_HOSTNAME },
      summary:
        'Same normalization as the form: a full URL works, and validation errors come back as {error: {code, message}}.',
    },
    ...domainOperationInputs(origin, PLACEHOLDER_DOMAIN_ID),
  ]
  return inputs.map(buildOperation)
}

export const buildDomainOperations = (origin: string, domainId: string): ApiOperation[] =>
  domainOperationInputs(origin, domainId).map(buildOperation)
