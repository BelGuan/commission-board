import { useEffect, useRef, useState } from 'react'
import { listArtists } from '../api/client'

export function useArtistResults(queryArgs, pageSize = 12) {
  const key = JSON.stringify(queryArgs)

  const [request, setRequest] = useState({ key, page: 1 })
  const [state, setState] = useState({
    items: [],
    total: 0,
    blockingFilters: [],
    error: null,
    loading: true,
  })

  if (request.key !== key) setRequest({ key, page: 1 })

  const runIdRef = useRef(0)

  useEffect(() => {
    const runId = ++runIdRef.current
    const isFirstPage = request.page === 1

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      items: isFirstPage ? [] : prev.items,
      total: isFirstPage ? 0 : prev.total,
    }))

    listArtists({ ...JSON.parse(request.key), page: request.page, pageSize })
      .then((result) => {
        if (runId !== runIdRef.current) return
        setState((prev) => ({
          items: isFirstPage ? result.items : [...prev.items, ...result.items],
          total: result.total,
          blockingFilters: result.blockingFilters ?? [],
          error: null,
          loading: false,
        }))
      })
      .catch((error) => {
        if (runId !== runIdRef.current) return
        setState({ items: [], total: 0, blockingFilters: [], error, loading: false })
      })

    return () => {
      runIdRef.current += 1
    }
  }, [request, pageSize])

  const loadMore = () => setRequest((current) => ({ ...current, page: current.page + 1 }))

  return {
    ...state,
    page: request.page,

    isInitialLoading: state.loading && request.page === 1,
    isLoadingMore: state.loading && request.page > 1,
    hasMore: state.items.length < state.total,
    loadMore,
  }
}

export default useArtistResults
