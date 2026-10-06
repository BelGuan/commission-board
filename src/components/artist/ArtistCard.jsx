import { Link } from 'react-router-dom'
import { Clock, Wallet } from 'lucide-react'
import { Card, CardBody, CardFooter } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { StarRating } from './StarRating'
import { AvailabilityPill } from './AvailabilityPill'
import { contentTagLabel, styleLabel } from '../../data/constants'
import { formatPriceRange, formatTurnaround } from '../../lib/format'

const MAX_BADGES = 3

export function ArtistCard({ artist }) {
  const {
    handle, displayName, avatarUrl, bannerUrl, sheetImages = [],
    styles = [], contentTags = [], priceMin, priceMax, currency,
    turnaroundDays, rating, reviewCount,
  } = artist

  const heroImage = sheetImages[0] ?? bannerUrl
  const extraStyles = Math.max(0, styles.length - MAX_BADGES)

  return (
    <Card as={Link} to={`/artist/${handle}`} interactive className="flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        <img
          src={heroImage}
          alt={`Commission sheet by ${displayName}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex justify-end p-3">
          <AvailabilityPill artist={artist} />
        </div>
      </div>

      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="relative z-10 -mt-9 flex items-end gap-3">
          <Avatar src={avatarUrl} name={displayName} size="lg" ring />
          <div className="min-w-0 pb-0.5">
            <h3 className="truncate text-h4 leading-tight">{displayName}</h3>
            <p className="truncate text-caption text-text-muted">@{handle}</p>
          </div>
        </div>

        <StarRating rating={rating} reviewCount={reviewCount} />

        <div className="flex flex-wrap gap-1.5">
          {styles.slice(0, MAX_BADGES).map((id) => (
            <Badge key={id} variant="accent">
              {styleLabel(id)}
            </Badge>
          ))}
          {extraStyles ? <Badge variant="neutral">+{extraStyles}</Badge> : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {contentTags.slice(0, MAX_BADGES).map((id) => (
            <Badge key={id} variant="neutral">
              {contentTagLabel(id)}
            </Badge>
          ))}
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-small font-semibold text-text-primary">
          <Wallet size={14} className="text-text-subtle" aria-hidden="true" />
          {formatPriceRange(priceMin, priceMax, currency)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
          <Clock size={14} className="text-text-subtle" aria-hidden="true" />
          {formatTurnaround(turnaroundDays)}
        </span>
      </CardFooter>
    </Card>
  )
}

export default ArtistCard
