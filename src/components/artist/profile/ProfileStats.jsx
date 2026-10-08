import { CheckCircle2, Clock, MessageSquare, Star } from 'lucide-react'
import { formatCount, formatRating, formatTurnaround } from '../../../lib/format'

const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center sm:items-start sm:text-left">
    <span className="inline-flex items-center gap-1.5 text-h4 font-semibold text-text-primary">
      <Icon size={15} className="text-text-subtle" aria-hidden="true" />
      {value}
    </span>
    <span className="text-caption text-text-muted">{label}</span>
  </div>
)

export function ProfileStats({ artist }) {
  return (
    <div className="grid grid-cols-2 divide-border rounded-card border border-border bg-surface sm:grid-cols-4 sm:divide-x">
      <Stat
        icon={Star}
        value={artist.reviewCount ? formatRating(artist.rating) : '—'}
        label={artist.reviewCount ? 'Average rating' : 'Not yet rated'}
      />
      <Stat
        icon={MessageSquare}
        value={formatCount(artist.reviewCount)}
        label={artist.reviewCount === 1 ? 'Review' : 'Reviews'}
      />
      <Stat
        icon={CheckCircle2}
        value={formatCount(artist.completedCommissions)}
        label="Commissions completed"
      />
      <Stat
        icon={Clock}
        value={formatTurnaround(artist.turnaroundDays)}
        label="Average turnaround"
      />
    </div>
  )
}

export default ProfileStats
