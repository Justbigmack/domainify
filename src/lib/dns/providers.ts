export type DnsProvider = {
  id: string
  displayName: string
  nsPatterns: readonly string[]
  dashboardUrl: string
  hostFieldHint: string
}

export const DNS_PROVIDERS: readonly DnsProvider[] = [
  {
    id: 'cloudflare',
    displayName: 'Cloudflare',
    nsPatterns: ['ns.cloudflare.com'],
    dashboardUrl: 'https://dash.cloudflare.com',
    hostFieldHint: 'Cloudflare accepts the record name with or without your domain appended.',
  },
  {
    id: 'route53',
    displayName: 'Amazon Route 53',
    nsPatterns: ['awsdns-'],
    dashboardUrl: 'https://console.aws.amazon.com/route53',
    hostFieldHint: 'Route 53 expects the full record name and appends nothing.',
  },
  {
    id: 'godaddy',
    displayName: 'GoDaddy',
    nsPatterns: ['domaincontrol.com'],
    dashboardUrl: 'https://dcc.godaddy.com/manage-dns',
    hostFieldHint: 'GoDaddy expects only the name prefix. It appends your domain automatically.',
  },
  {
    id: 'namecheap',
    displayName: 'Namecheap',
    nsPatterns: ['registrar-servers.com'],
    dashboardUrl: 'https://ap.www.namecheap.com',
    hostFieldHint: 'Namecheap expects only the name prefix in the Host field.',
  },
  {
    id: 'vercel',
    displayName: 'Vercel DNS',
    nsPatterns: ['vercel-dns.com'],
    dashboardUrl: 'https://vercel.com/dashboard/domains',
    hostFieldHint: 'Vercel expects only the name prefix in the Name field.',
  },
  {
    id: 'porkbun',
    displayName: 'Porkbun',
    nsPatterns: ['porkbun.com'],
    dashboardUrl: 'https://porkbun.com/account/domainsSpeedy',
    hostFieldHint: 'Porkbun expects only the name prefix. It appends your domain automatically.',
  },
  {
    id: 'digitalocean',
    displayName: 'DigitalOcean',
    nsPatterns: ['digitalocean.com'],
    dashboardUrl: 'https://cloud.digitalocean.com/networking/domains',
    hostFieldHint: 'DigitalOcean expects only the name prefix in the Hostname field.',
  },
  {
    id: 'squarespace',
    displayName: 'Squarespace',
    nsPatterns: ['squarespacedns.com'],
    dashboardUrl: 'https://account.squarespace.com/domains',
    hostFieldHint: 'Squarespace expects only the name prefix in the Host field.',
  },
  {
    id: 'google-cloud-dns',
    displayName: 'Google Cloud DNS',
    nsPatterns: ['googledomains.com'],
    dashboardUrl: 'https://console.cloud.google.com/net-services/dns',
    hostFieldHint: 'Google Cloud DNS expects the full record name ending with a dot.',
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
