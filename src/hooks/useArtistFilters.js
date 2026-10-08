import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMatureContent } from '../context/MatureContentContext'
import { turnaroundMaxDays } from '../data/constants'

const KEYS = {
  styles: 'styles',
  commissionTypes: 'types',
  contentTags: 'tags',
  priceMin: 'min',
  priceMax: 'max',
  turnaround: 'turnaround',
  openOnly: 'open',
  query: 'q',
  sort: 'sort',
}

const DEFAULT_SORT = 'recommended'

const readList = (params, key) => {
  const raw = params.get(key)
  return raw ? raw.split(',').filter(Boolean) : []
}

const readNumber = (params, key) => {
  const raw = params.get(key)
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const isEmptyValue = (value) =>
  value == null ||
  value === '' ||
  value === false ||
  (Array.isArray(value) && value.length === 0)

const serialize = (value) => {
  if (Array.isArray(value)) return value.join(',')
  if (value === true) return '1'
  return String(value)
}

export function useArtistFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { restrictedTags, includeRestricted, clearRestricted } = useMatureContent()

  const filters = useMemo(
    () => ({
      styles: readList(searchParams, KEYS.styles),
      commissionTypes: readList(searchParams, KEYS.commissionTypes),
      contentTags: readList(searchParams, KEYS.contentTags),
      priceMin: readNumber(searchParams, KEYS.priceMin),
      priceMax: readNumber(searchParams, KEYS.priceMax),
      turnaround: searchParams.get(KEYS.turnaround) ?? 'any',
      openOnly: searchParams.get(KEYS.openOnly) === '1',
      query: searchParams.get(KEYS.query) ?? '',
      sort: searchParams.get(KEYS.sort) ?? DEFAULT_SORT,

      restrictedTags,
    }),
    [searchParams, restrictedTags],
  )

  const applyPatch = useCallback((params, key, value) => {
    const urlKey = KEYS[key]
    if (!urlKey) return
    const isDefaultSort = key === 'sort' && value === DEFAULT_SORT
    const isAnyTurnaround = key === 'turnaround' && value === 'any'

    if (isEmptyValue(value) || isDefaultSort || isAnyTurnaround) params.delete(urlKey)
    else params.set(urlKey, serialize(value))
  }, [])

  const setFilters = useCallback(
    (patch) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(patch).forEach(([key, value]) => applyPatch(next, key, value))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, applyPatch],
  )

  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters])

  const toggleFilter = useCallback(
    (key, id) => {
      const current = filters[key] ?? []
      setFilter(key, current.includes(id) ? current.filter((v) => v !== id) : [...current, id])
    },
    [filters, setFilter],
  )

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
    clearRestricted()
  }, [setSearchParams, clearRestricted])

  const activeCount = useMemo(
    () =>
      filters.styles.length +
      filters.commissionTypes.length +
      filters.contentTags.length +
      filters.restrictedTags.length +
      (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
      (filters.turnaround !== 'any' ? 1 : 0) +
      (filters.openOnly ? 1 : 0) +
      (filters.query.trim() ? 1 : 0),
    [filters],
  )

  const queryArgs = useMemo(
    () => ({
      styles: filters.styles,
      commissionTypes: filters.commissionTypes,
      contentTags: [...filters.contentTags, ...filters.restrictedTags],
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      turnaroundMaxDays: turnaroundMaxDays(filters.turnaround),
      openOnly: filters.openOnly,
      query: filters.query,
      sort: filters.sort,
      includeRestricted,
    }),
    [filters, includeRestricted],
  )

  return { filters, setFilter, setFilters, toggleFilter, clearAll, activeCount, queryArgs }
}

export default useArtistFilters
