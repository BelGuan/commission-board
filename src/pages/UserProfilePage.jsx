import { Link, useParams } from 'react-router-dom'
import { UserX } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { EmptyState } from '../components/common/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { RatingDistribution } from '../components/artist/profile/RatingDistribution'
import { useAsync } from '../hooks/useAsync'
import { getUserReputation } from '../api/client'
import { formatJoinedDate } from '../lib/format'

const AXIS_LABELS = {
  paid_on_time: 'Paid on time',
  communication: 'Communication',
  respected_boundaries: 'Respected boundaries',
}

export function UserProfilePage() {
  const { username } = useParams()
  const { data: person, loading, error } = useAsync(
    () => getUserReputation(username),
    [username],
  )

  if (loading) {
    return (
      <div className="shell max-w-3xl space-y-6 py-10">
        <Skeleton variant="circle" className="h-20 w-20" />
        <Skeleton variant="text" className="h-6 w-48" />
        <Skeleton variant="block" className="h-36 rounded-card" />
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="shell py-14">
        <EmptyState
          icon={UserX}
          title={`No user “${username}”`}
          description="The account may have been removed, or the link is out of date."
          action={
            <Button as={Link} to="/browse">
              Browse the board
            </Button>
          }
        />
      </div>
    )
  }

  const axes = Object.entries(person.subRatingAverages ?? {})

  return (
    <div className="shell max-w-3xl space-y-8 py-10 sm:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={person.avatarUrl} name={person.displayName} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-h2">{person.displayName}</h1>
          <p className="text-small text-text-muted">@{person.username}</p>
          <p className="mt-1 text-caption text-text-subtle">
            Member since {formatJoinedDate(person.joinedAt)}
          </p>
        </div>
        {person.artistHandle ? (
          <Button as={Link} to={`/artist/${person.artistHandle}`} variant="secondary" size="sm">
            View their commission sheet
          </Button>
        ) : null}
      </header>

      {person.bio ? <p className="max-w-prose text-body text-text-muted">{person.bio}</p> : null}

      <div className="grid grid-cols-2 divide-border rounded-card border border-border bg-surface sm:grid-cols-3 sm:divide-x">
        {[
          [person.completedCommissions, 'Commissions completed'],
          [person.reviewCount, person.reviewCount === 1 ? 'Review' : 'Reviews'],
          [
            person.wouldWorkAgainPct == null ? '—' : `${person.wouldWorkAgainPct}%`,
            'Would work with again',
          ],
        ].map(([value, label]) => (
          <div key={label} className="px-3 py-4 text-center sm:text-left">
            <p className="text-h3">{value}</p>
            <p className="text-caption text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {person.reviewCount ? (
        <>
          <RatingDistribution
            distribution={person.ratingDistribution}
            total={person.reviewCount}
            average={person.rating}
          />

          {axes.length ? (
            <section className="rounded-card border border-border bg-surface p-5">
              <h2 className="text-h4">As a client</h2>
              <ul className="mt-3 space-y-2">
                {axes.map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between gap-4">
                    <span className="text-small text-text-muted">
                      {AXIS_LABELS[key] ?? key}
                    </span>
                    <Badge variant={value >= 4.5 ? 'success' : 'neutral'} size="md">
                      {value.toFixed(1)} / 5
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No reviews yet"
          description={
            person.completedCommissions
              ? 'They have completed work but nobody has reviewed them yet.'
              : 'They have not completed a commission through the board yet.'
          }
        />
      )}

      <PageHeader
        eyebrow="Why this page exists"
        title=""
        description="Reviews run both ways on Commission Board. Artists can see how someone behaves as a client — whether they pay on time, communicate clearly and respect stated boundaries — before agreeing to take the job."
      />
    </div>
  )
}

export default UserProfilePage
