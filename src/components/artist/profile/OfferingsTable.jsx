import { Clock, RefreshCw } from 'lucide-react'
import { Badge } from '../../ui/Badge'
import { Skeleton } from '../../ui/Skeleton'
import { EmptyState } from '../../common/EmptyState'
import { commissionTypeLabel } from '../../../data/constants'
import { formatPriceRange, formatTurnaround } from '../../../lib/format'

function OfferingRow({ offering }) {
  return (
    <li className="flex gap-4 p-4">
      <img
        src={offering.thumbnailUrl}
        alt=""
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover sm:h-24 sm:w-24"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <Badge variant="neutral">{commissionTypeLabel(offering.type)}</Badge>
            <h4 className="mt-1.5 text-h4 leading-snug">{offering.title}</h4>
          </div>
          <span className="shrink-0 text-h4 font-semibold text-text-primary">
            {formatPriceRange(offering.priceFrom, offering.priceTo, offering.currency)}
          </span>
        </div>

        <p className="mt-1.5 text-small text-text-muted">{offering.description}</p>
        {offering.addOns ? (
          <p className="mt-1 text-caption text-text-subtle">{offering.addOns}</p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
            <Clock size={13} className="text-text-subtle" aria-hidden="true" />
            {formatTurnaround(offering.turnaroundDays)} delivery
          </span>
          <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
            <RefreshCw size={13} className="text-text-subtle" aria-hidden="true" />
            {offering.revisions} revision{offering.revisions === 1 ? '' : 's'} included
          </span>
          {offering.isActive ? null : <Badge variant="neutral">Not currently offered</Badge>}
        </div>
      </div>
    </li>
  )
}

export function OfferingsTable({ offerings = [], loading }) {
  if (loading) {
    return (
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-4 p-4">
            <Skeleton className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton variant="pill" className="w-16" />
              <Skeleton variant="text" className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (!offerings.length) {
    return (
      <EmptyState
        title="No offerings listed"
        description="This artist hasn’t published priced line items yet. The sheet above is the source of truth for now."
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-surface">
      {offerings.map((offering) => (
        <OfferingRow key={offering.id} offering={offering} />
      ))}
    </ul>
  )
}

export default OfferingsTable
