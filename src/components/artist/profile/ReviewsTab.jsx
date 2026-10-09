import { MessageSquare } from 'lucide-react'
import { ReviewItem } from './ReviewItem'
import { RatingDistribution } from './RatingDistribution'
import { Skeleton } from '../../ui/Skeleton'
import { EmptyState } from '../../common/EmptyState'
import { useAsync } from '../../../hooks/useAsync'
import { listReviews } from '../../../api/client'

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="block" className="h-36 rounded-card" />
      <ul className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-3 py-5">
            <Skeleton variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReviewsTab({ artist }) {
  const { data, loading, error } = useAsync(
    () => listReviews({ subjectId: artist.id, subjectType: 'artist' }),
    [artist.id],
  )

  if (loading) return <ReviewsSkeleton />

  if (error) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Couldn’t load reviews"
        description={error.message ?? 'Try reloading the page.'}
      />
    )
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet"
        description={`${artist.displayName} hasn’t been reviewed on the board yet. Their terms and commission sheet are the best signal for now.`}
      />
    )
  }

  return (
    <div className="space-y-6">
      <RatingDistribution
        distribution={data.distribution}
        total={data.total}
        average={data.average}
      />

      <ul className="divide-y divide-border">
        {data.items.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>

      {data.total > data.items.length ? (
        <p className="text-center text-caption text-text-muted">
          Showing {data.items.length} of {data.total} reviews.
        </p>
      ) : null}
    </div>
  )
}

export default ReviewsTab
