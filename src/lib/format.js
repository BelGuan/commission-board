export function formatPrice(amount, currency = 'USD') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPriceRange(min, max, currency = 'USD') {
  if (min == null && max == null) return 'Ask for a quote'
  if (min != null && max != null && min !== max) {
    return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`
  }
  return formatPrice(min ?? max, currency)
}

export function formatTurnaround(days) {
  if (days == null) return 'Varies'
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`
  const weeks = Math.round(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'}`
}

export function formatRating(rating) {
  return Number(rating ?? 0).toFixed(1)
}

export function formatCount(n) {
  if (n == null) return '0'
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const diffDays = Math.round((Date.parse(iso) - Date.now()) / 86_400_000)
  if (Math.abs(diffDays) < 1) return 'today'
  if (Math.abs(diffDays) < 30) return RELATIVE.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) return RELATIVE.format(Math.round(diffDays / 30), 'month')
  return RELATIVE.format(Math.round(diffDays / 365), 'year')
}

export function formatJoinedDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(Date.parse(iso))
}

export function availabilityStatus({ isOpen, slotsOpen }) {
  if (!isOpen) return { key: 'closed', label: 'Closed', tone: 'neutral' }
  if (!slotsOpen) return { key: 'waitlist', label: 'Waitlist', tone: 'warning' }
  return {
    key: 'open',
    label: `Open · ${slotsOpen} slot${slotsOpen === 1 ? '' : 's'}`,
    tone: 'success',
  }
}

export function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}
