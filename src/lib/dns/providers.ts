export type DnsProvider = {
  id: string
  displayName: string
  nsPatterns: readonly string[]
  dashboardUrl: string
  logoDomain: string
  hostFieldName: string
  valueFieldName: string
  hostFieldHint: string
}

export const DNS_PROVIDERS: readonly DnsProvider[] = [
  {
    id: 'cloudflare',
    displayName: 'Cloudflare',
    nsPatterns: ['ns.cloudflare.com'],
    dashboardUrl: 'https://dash.cloudflare.com',
    logoDomain: 'cloudflare.com',
    hostFieldName: 'Name',
    valueFieldName: 'Content',
    hostFieldHint:
      'Cloudflare appends your domain to the Name field automatically, so paste just the prefix. Pasting the full name works too.',
  },
  {
    id: 'route53',
    displayName: 'Amazon Route 53',
    nsPatterns: ['awsdns-'],
    dashboardUrl: 'https://console.aws.amazon.com/route53',
    logoDomain: 'aws.amazon.com',
    hostFieldName: 'Record name',
    valueFieldName: 'Value',
    hostFieldHint:
      'The console shows your domain after the Record name input and appends it for you, so type just the prefix.',
  },
  {
    id: 'godaddy',
    displayName: 'GoDaddy',
    nsPatterns: ['domaincontrol.com'],
    dashboardUrl: 'https://dcc.godaddy.com/manage-dns',
    logoDomain: 'godaddy.com',
    hostFieldName: 'Name',
    valueFieldName: 'Value',
    hostFieldHint:
      'GoDaddy appends your domain to the Name field automatically, so enter just the prefix.',
  },
  {
    id: 'namecheap',
    displayName: 'Namecheap',
    nsPatterns: ['registrar-servers.com'],
    dashboardUrl: 'https://ap.www.namecheap.com',
    logoDomain: 'namecheap.com',
    hostFieldName: 'Host',
    valueFieldName: 'Value',
    hostFieldHint:
      'Namecheap appends your domain to the Host field automatically, so enter just the prefix.',
  },
  {
    id: 'vercel',
    displayName: 'Vercel DNS',
    nsPatterns: ['vercel-dns.com'],
    dashboardUrl: 'https://vercel.com/dashboard/domains',
    logoDomain: 'vercel.com',
    hostFieldName: 'Name',
    valueFieldName: 'Value',
    hostFieldHint:
      'Vercel appends your domain to the Name field automatically, so enter just the prefix.',
  },
  {
    id: 'porkbun',
    displayName: 'Porkbun',
    nsPatterns: ['porkbun.com'],
    dashboardUrl: 'https://porkbun.com/account/domainsSpeedy',
    logoDomain: 'porkbun.com',
    hostFieldName: 'Host',
    valueFieldName: 'Answer',
    hostFieldHint:
      'Porkbun appends your domain to the Host field automatically, so enter just the prefix.',
  },
  {
    id: 'digitalocean',
    displayName: 'DigitalOcean',
    nsPatterns: ['digitalocean.com'],
    dashboardUrl: 'https://cloud.digitalocean.com/networking/domains',
    logoDomain: 'digitalocean.com',
    hostFieldName: 'Hostname',
    valueFieldName: 'Value',
    hostFieldHint:
      'DigitalOcean appends your domain to the Hostname field automatically, so enter just the prefix.',
  },
  {
    id: 'squarespace',
    displayName: 'Squarespace',
    nsPatterns: ['squarespacedns.com'],
    dashboardUrl: 'https://account.squarespace.com/domains',
    logoDomain: 'squarespace.com',
    hostFieldName: 'Host',
    valueFieldName: 'Data',
    hostFieldHint:
      'Squarespace appends your domain to the Host field automatically, so enter just the prefix.',
  },
  {
    id: 'google-cloud-dns',
    displayName: 'Google Cloud DNS',
    nsPatterns: ['googledomains.com'],
    dashboardUrl: 'https://console.cloud.google.com/net-services/dns',
    logoDomain: 'cloud.google.com',
    hostFieldName: 'DNS name',
    valueFieldName: 'TXT data',
    hostFieldHint:
      'The console shows your domain after the DNS name input and appends it for you, so enter just the prefix.',
  },
] as const

export const detectDnsProvider = (nameserverHostnames: string[]): DnsProvider | null => {
  const loweredHostnames = nameserverHostnames.map((hostname) => hostname.toLowerCase())
  return (
    DNS_PROVIDERS.find((provider) =>
      provider.nsPatterns.some((pattern) =>
        loweredHostnames.some((hostname) => hostname.includes(pattern)),
      ),
    ) ?? null
  )
}
