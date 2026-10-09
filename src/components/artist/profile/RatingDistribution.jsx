import { Star } from 'lucide-react'
import { formatRating } from '../../../lib/format'

export function RatingDistribution({ distribution = [], total = 0, average = 0 }) {
  const peak = Math.max(1, ...distribution.map((bin) => bin.count))

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32">
        <span className="font-display text-display leading-none">{formatRating(average)}</span>
        <span className="inline-flex gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={13}
              className={n <= Math.round(average) ? 'fill-warning text-warning' : 'text-border-strong'}
            />
          ))}
        </span>
        <span className="text-caption text-text-muted">
          {total} review{total === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="flex-1 space-y-1.5">
        {distribution.map(({ stars, count }) => (
          <li key={stars} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-caption text-text-muted">{stars} star</span>
            <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted">
              <span
                className="block h-full rounded-pill bg-warning"
                style={{ width: `${(count / peak) * 100}%` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-caption text-text-muted">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RatingDistribution
