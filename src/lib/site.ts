const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export function parseDomain(input: string): string | null {
  const raw = input.trim().toLowerCase()
  if (!raw || raw.includes(' ')) return null

  const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`

  let host: string
  try {
    host = new URL(candidate).hostname
  } catch {
    return null
  }

  host = host.replace(/^www\./, '')
  if (!host.includes('.') || !DOMAIN_RE.test(host)) return null

  return host
}

const COMPOUND_TLDS = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'co.jp',
  'co.kr',
  'co.il',
  'co.in',
  'co.za',
  'com.br',
  'com.mx',
  'com.ar',
  'com.co',
  'com.pe',
  'com.ec',
  'com.uy',
  'com.es',
  'com.tr',
  'com.sg',
  'com.hk',
  'com.cn',
  'com.pl',
])

export function nameFromDomain(domain: string): string {
  const labels = domain.split('.')
  if (labels.length < 2) return domain

  const suffix = labels.slice(-2).join('.')
  const index = COMPOUND_TLDS.has(suffix) ? labels.length - 3 : labels.length - 2
  const label = labels[Math.max(index, 0)] ?? domain

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function logoUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`
}
