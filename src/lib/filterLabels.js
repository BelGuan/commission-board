import {
  styleLabel,
  contentTagLabel,
  commissionTypeLabel,
  turnaroundLabel,
} from '../data/constants'
import { formatPrice } from './format'

export const FACET_LABELS = {
  styles: 'Art style',
  commissionTypes: 'Commission type',
  contentTags: 'Content tag',
  restrictedTags: 'Mature tag',
  price: 'Price range',
  turnaround: 'Turnaround',
  openOnly: 'Open slots only',
  query: 'Search',
}

export function priceLabel(priceMin, priceMax) {
  if (priceMin != null && priceMax != null) {
    return `${formatPrice(priceMin)} – ${formatPrice(priceMax)}`
  }
  if (priceMin != null) return `From ${formatPrice(priceMin)}`
  if (priceMax != null) return `Up to ${formatPrice(priceMax)}`
  return null
}

export function describeActiveFilters(filters) {
  const chips = []

  filters.styles.forEach((id) =>
    chips.push({ key: `styles:${id}`, facet: 'styles', value: id, label: styleLabel(id) }),
  )

  filters.commissionTypes.forEach((id) =>
    chips.push({
      key: `types:${id}`,
      facet: 'commissionTypes',
      value: id,
      label: commissionTypeLabel(id),
    }),
  )

  filters.contentTags.forEach((id) =>
    chips.push({ key: `tags:${id}`, facet: 'contentTags', value: id, label: contentTagLabel(id) }),
  )

  filters.restrictedTags.forEach((id) =>
    chips.push({
      key: `restricted:${id}`,
      facet: 'restrictedTags',
      value: id,
      label: contentTagLabel(id),
      restricted: true,
    }),
  )

  const price = priceLabel(filters.priceMin, filters.priceMax)
  if (price) chips.push({ key: 'price', facet: 'price', label: price })

  if (filters.turnaround !== 'any') {
    chips.push({ key: 'turnaround', facet: 'turnaround', label: turnaroundLabel(filters.turnaround) })
  }

  if (filters.openOnly) {
    chips.push({ key: 'open', facet: 'openOnly', label: 'Open slots only' })
  }

  if (filters.query.trim()) {
    chips.push({ key: 'query', facet: 'query', label: `“${filters.query.trim()}”` })
  }

  return chips
}

export function describeFacet(facet, filters) {
  const name = FACET_LABELS[facet] ?? facet
  if (facet === 'price') return `${name} (${priceLabel(filters.priceMin, filters.priceMax)})`
  if (facet === 'turnaround') return `${name} (${turnaroundLabel(filters.turnaround)})`
  if (facet === 'query') return `${name} (“${filters.query.trim()}”)`
  if (facet === 'openOnly') return name

  const values = filters[facet] ?? []
  const labelFor =
    facet === 'styles' ? styleLabel : facet === 'commissionTypes' ? commissionTypeLabel : contentTagLabel
  return `${name} (${values.map(labelFor).join(', ')})`
}

export const clearFacetPatch = (facet) => {
  if (facet === 'price') return { priceMin: null, priceMax: null }
  if (facet === 'turnaround') return { turnaround: 'any' }
  if (facet === 'openOnly') return { openOnly: false }
  if (facet === 'query') return { query: '' }
  return { [facet]: [] }
}
