import { useEffect, useRef, useState } from 'react'
import { listArtists } from '../api/client'
import { useDebouncedValue } from './useDebouncedValue'

const MIN_QUERY_LENGTH = 2

export function useArtistSearch(rawQuery, { limit = 5, delay = 300 } = {}) {
  const query = useDebouncedValue(rawQuery.trim(), delay)
  const [state, setState] = useState({ results: [], total: 0, loading: false })
  const runIdRef = useRef(0)

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      runIdRef.current += 1
      setState({ results: [], total: 0, loading: false })
      return undefined
    }

    const runId = ++runIdRef.current
    setState((prev) => ({ ...prev, loading: true }))

    listArtists({ query, pageSize: limit, sort: 'recommended' })
      .then((result) => {
        if (runId !== runIdRef.current) return
        setState({ results: result.items, total: result.total, loading: false })
      })
      .catch(() => {
        if (runId !== runIdRef.current) return
        setState({ results: [], total: 0, loading: false })
      })

    return () => {
      runIdRef.current += 1
    }
  }, [query, limit])

  return { ...state, query, isTooShort: rawQuery.trim().length < MIN_QUERY_LENGTH }
}

export default useArtistSearch
