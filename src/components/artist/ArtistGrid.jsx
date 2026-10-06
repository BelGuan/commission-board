import { SearchX } from 'lucide-react'
import { ArtistCard } from './ArtistCard'
import { ArtistCardSkeleton } from './ArtistCardSkeleton'
import { EmptyState } from '../common/EmptyState'

const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
const SKELETON_COUNT = 6

export function ArtistGrid({ artists = [], loading, error, emptyAction }) {
  if (loading) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading artists">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={SearchX}
        title="We couldn’t load the board"
        description={error.message ?? 'Something went wrong on our side. Try again in a moment.'}
        action={emptyAction}
      />
    )
  }

  if (!artists.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="No artists match yet"
        description="Nobody on the board fits these filters right now. Loosening the price range or turnaround usually helps."
        action={emptyAction}
      />
    )
  }

  return (
    <div className={GRID}>
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}

export default ArtistGrid
