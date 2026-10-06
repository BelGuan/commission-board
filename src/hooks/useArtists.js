import { useMemo } from 'react'
import { listArtists } from '../api/client'
import { useAsync } from './useAsync'

export function useArtists(params = {}) {
  const key = JSON.stringify(params)

  const { data, error, loading, refetch } = useAsync(
    () => listArtists(JSON.parse(key)),
    [key],
  )

  return useMemo(
    () => ({
      artists: data?.items ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 12,
      loading,
      error,
      refetch,
      isEmpty: !loading && !error && (data?.items?.length ?? 0) === 0,
    }),
    [data, loading, error, refetch],
  )
}

export default useArtists
