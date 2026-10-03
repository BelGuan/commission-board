import { useState } from 'react'
import { cn } from '../../lib/cn'
import { initialsOf } from '../../lib/format'

const SIZES = {
  xs: 'h-6 w-6 text-micro',
  sm: 'h-8 w-8 text-caption',
  md: 'h-11 w-11 text-small',
  lg: 'h-16 w-16 text-h4',
  xl: 'h-24 w-24 text-h2',
}

export function Avatar({ src, name = '', size = 'md', ring = false, className }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-semibold text-text-muted',
        ring && 'ring-2 ring-surface',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ? `${name}’s avatar` : ''}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name) || '·'}</span>
      )}
    </span>
  )
}

export default Avatar
