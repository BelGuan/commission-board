import { BadgeCheck, Star } from 'lucide-react'
import { Avatar } from '../../ui/Avatar'
import { Badge } from '../../ui/Badge'
import { commissionTypeLabel } from '../../../data/constants'
import { formatRelativeTime } from '../../../lib/format'

export function ReviewItem({ review }) {
  return (
    <li className="flex gap-3 py-5">
      <Avatar src={review.authorAvatarUrl} name={review.authorName} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-small font-semibold text-text-primary">{review.authorName}</span>
          {review.verified ? (
            <Badge variant="success" icon={BadgeCheck}>
              Verified commission
            </Badge>
          ) : null}
          <span className="ml-auto text-caption text-text-subtle">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={12}
                aria-hidden="true"
                className={n <= review.rating ? 'fill-warning text-warning' : 'text-border-strong'}
              />
            ))}
          </span>
          <span className="text-caption text-text-muted">
            {commissionTypeLabel(review.commissionType)}
          </span>
        </div>

        <p className="mt-2 text-body text-text-muted">{review.body}</p>
      </div>
    </li>
  )
}

export default ReviewItem
