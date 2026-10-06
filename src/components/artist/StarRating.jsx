import { Star } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatCount, formatRating } from '../../lib/format'

export function StarRating({ rating = 0, reviewCount = 0, className }) {
  if (!reviewCount) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-caption text-text-subtle', className)}>
        <Star size={13} strokeWidth={2} aria-hidden="true" />
        New artist · no reviews yet
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-caption text-text-muted', className)}
      title={`${formatRating(rating)} out of 5 from ${reviewCount} reviews`}
    >
      <Star size={13} className="fill-warning text-warning" aria-hidden="true" />
      <span className="font-semibold text-text-primary">{formatRating(rating)}</span>
      <span>({formatCount(reviewCount)})</span>
    </span>
  )
}

export default StarRating
