import { getArtist } from '../api/client'
import { useAsync } from './useAsync'
import { useMatureContent } from '../context/MatureContentContext'

export function useArtist(handle) {
  const { ageConfirmed } = useMatureContent()

  const { data, error, loading, refetch } = useAsync(
    () => getArtist(handle, { includeRestricted: ageConfirmed }),
    [handle, ageConfirmed],
  )

  return { artist: data, error, loading, refetch }
}

export default useArtist
