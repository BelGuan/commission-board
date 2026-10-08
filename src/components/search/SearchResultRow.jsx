import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/cn'
import { availabilityStatus, formatPriceRange } from '../../lib/format'

const TONE = {
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-text-subtle',
}

export function SearchResultRow({ artist, active, id, onSelect, onHover }) {
  const status = availabilityStatus(artist)

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(event) => {

        event.preventDefault()
        onSelect(artist)
      }}
      onMouseEnter={onHover}
      className={cn(
        'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors',
        active ? 'bg-surface-muted' : 'bg-transparent',
      )}
    >
      <Avatar src={artist.avatarUrl} name={artist.displayName} size="sm" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-medium text-text-primary">
          {artist.displayName}
        </span>
        <span className="block truncate text-caption text-text-muted">@{artist.handle}</span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-caption font-semibold text-text-primary">
          {formatPriceRange(artist.priceMin, artist.priceMax, artist.currency)}
        </span>
        <span className={cn('block text-micro', TONE[status.tone])}>{status.label}</span>
      </span>
    </li>
  )
}

export default SearchResultRow
