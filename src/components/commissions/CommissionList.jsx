import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../common/EmptyState'
import { formatPrice, formatRelativeTime } from '../../lib/format'

const TONE = {
  requested: 'warning',
  accepted: 'accent',
  in_progress: 'accent',
  completed: 'success',
  declined: 'neutral',
  cancelled: 'neutral',
}

const LABEL = {
  requested: 'Requested',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

export const NEXT_STEPS = {
  artist: {
    requested: [
      { status: 'accepted', label: 'Accept', variant: 'primary' },
      { status: 'declined', label: 'Decline', variant: 'secondary' },
    ],
    accepted: [
      { status: 'in_progress', label: 'Start work', variant: 'primary' },
      { status: 'cancelled', label: 'Cancel', variant: 'ghost' },
    ],
    in_progress: [
      { status: 'completed', label: 'Mark complete', variant: 'primary' },
      { status: 'cancelled', label: 'Cancel', variant: 'ghost' },
    ],
  },
  client: {
    accepted: [{ status: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  },
}

function CommissionRow({ commission, role, onTransition, onReview, pending }) {
  const other = role === 'artist' ? commission.client : commission.artistUser
  const steps = NEXT_STEPS[role]?.[commission.status] ?? []

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
      <Avatar src={other?.avatarUrl} name={other?.displayName ?? ''} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-h4 leading-snug">{commission.title}</h3>
          <Badge variant={TONE[commission.status] ?? 'neutral'}>
            {LABEL[commission.status] ?? commission.status}
          </Badge>
        </div>

        <p className="mt-0.5 text-caption text-text-muted">
          {role === 'artist' ? 'From' : 'With'}{' '}
          {other ? (
            <Link
              to={
                role === 'artist'
                  ? `/u/${other.username}`
                  : `/artist/${commission.artistHandle}`
              }
              className="font-medium text-text-primary underline underline-offset-2"
            >
              {other.displayName}
            </Link>
          ) : (
            'someone'
          )}
          {' · '}
          {formatRelativeTime(commission.requestedAt)}
          {commission.agreedPrice != null ? ` · ${formatPrice(commission.agreedPrice)}` : ''}
        </p>

        {commission.brief ? (
          <p className="mt-2 line-clamp-2 text-small text-text-muted">{commission.brief}</p>
        ) : null}

        {steps.length || (commission.status === 'completed' && !commission.reviewedByMe) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {steps.map((step) => (
              <Button
                key={step.status}
                size="sm"
                variant={step.variant}
                disabled={pending}
                onClick={() => onTransition(commission, step.status)}
              >
                {step.label}
              </Button>
            ))}
            {commission.status === 'completed' && !commission.reviewedByMe ? (
              <Button size="sm" variant="secondary" onClick={() => onReview(commission, role)}>
                Leave a review
              </Button>
            ) : null}
          </div>
        ) : null}

        {commission.status === 'completed' && commission.reviewedByMe ? (
          <p className="mt-2 text-caption text-success">You have reviewed this commission.</p>
        ) : null}
      </div>
    </li>
  )
}

export function CommissionList({
  commissions = [],
  role,
  loading,
  onTransition,
  onReview,
  pendingId,
  emptyTitle,
  emptyDescription,
}) {
  if (loading) {
    return (
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {[0, 1].map((i) => (
          <li key={i} className="flex gap-3 p-4">
            <Skeleton variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (!commissions.length) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-surface">
      {commissions.map((commission) => (
        <CommissionRow
          key={commission.id}
          commission={commission}
          role={role}
          onTransition={onTransition}
          onReview={onReview}
          pending={pendingId === commission.id}
        />
      ))}
    </ul>
  )
}

export default CommissionList
