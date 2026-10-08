import { Bookmark, BookmarkCheck, Globe, MapPin, CalendarDays } from 'lucide-react'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { AvailabilityPill } from '../AvailabilityPill'
import { styleLabel } from '../../../data/constants'
import { formatJoinedDate } from '../../../lib/format'

const Meta = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
    <Icon size={13} className="text-text-subtle" aria-hidden="true" />
    {children}
  </span>
)

export function ProfileHeader({ artist, saved, onToggleSave, onRequest }) {
  return (
    <header>
      <div className="relative h-40 overflow-hidden rounded-card bg-surface-muted sm:h-56">
        <img
          src={artist.bannerUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="relative mt-2 flex flex-col gap-4 px-1 sm:mt-3 sm:flex-row sm:items-end">
        <Avatar
          src={artist.avatarUrl}
          name={artist.displayName}
          size="xl"
          ring
          className="-mt-12 sm:-mt-14"
        />

        <div className="min-w-0 flex-1 sm:pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h2">{artist.displayName}</h1>
            <AvailabilityPill artist={artist} />
          </div>
          <p className="text-small text-text-muted">@{artist.handle}</p>
        </div>

        <div className="flex shrink-0 gap-2 sm:pb-1">
          <Button onClick={onRequest}>Request a commission</Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Remove bookmark' : 'Save artist'}
            title={saved ? 'Saved' : 'Save artist'}
          >
            {saved ? (
              <BookmarkCheck size={18} className="text-accent" />
            ) : (
              <Bookmark size={18} />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3 px-1">
        <p className="max-w-2xl text-body text-text-muted">{artist.bio}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Meta icon={MapPin}>{artist.location}</Meta>
          <Meta icon={Globe}>{artist.languages.join(', ')}</Meta>
          <Meta icon={CalendarDays}>Member since {formatJoinedDate(artist.joinedAt)}</Meta>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {artist.styles.map((id) => (
            <Badge key={id} variant="accent" size="md">
              {styleLabel(id)}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  )
}

export default ProfileHeader
