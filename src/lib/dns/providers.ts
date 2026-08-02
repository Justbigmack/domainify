export type DnsProvider = {
  id: string
  displayName: string
  nsPatterns: readonly string[]
  buildDashboardUrl: (registrableDomain: string) => string
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
    buildDashboardUrl: (registrableDomain) =>
      `https://dash.cloudflare.com/?to=/:account/${encodeURIComponent(registrableDomain)}/dns`,
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
    buildDashboardUrl: () => 'https://console.aws.amazon.com/route53/v2/hostedzones',
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
    buildDashboardUrl: (registrableDomain) =>
      `https://dcc.godaddy.com/control/${encodeURIComponent(registrableDomain)}/dns`,
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
    buildDashboardUrl: (registrableDomain) =>
      `https://ap.www.namecheap.com/Domains/DomainControlPanel/${encodeURIComponent(registrableDomain)}/advancedns`,
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
    buildDashboardUrl: (registrableDomain) =>
      `https://vercel.com/dashboard/domains?search=${encodeURIComponent(registrableDomain)}`,
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
    buildDashboardUrl: (registrableDomain) =>
      `https://porkbun.com/account/dns/${encodeURIComponent(registrableDomain)}`,
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
    buildDashboardUrl: (registrableDomain) =>
      `https://cloud.digitalocean.com/networking/domains/${encodeURIComponent(registrableDomain)}`,
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
    buildDashboardUrl: (registrableDomain) =>
      `https://account.squarespace.com/domains/managed/${encodeURIComponent(registrableDomain)}/dns/dns-settings`,
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
    buildDashboardUrl: () => 'https://console.cloud.google.com/net-services/dns/zones',
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
