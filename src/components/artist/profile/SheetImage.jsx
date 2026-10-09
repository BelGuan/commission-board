import { useState } from 'react'
import { Eye, ShieldAlert } from 'lucide-react'

export function SheetImage({ src, alt, gated = false }) {
  const [revealed, setRevealed] = useState(false)
  const covered = gated && !revealed

  return (
    <figure className="relative overflow-hidden rounded-card border border-border bg-surface-muted">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={covered ? 'w-full scale-105 blur-2xl' : 'w-full'}
      />

      {covered ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-text-primary/25 text-accent-contrast backdrop-blur-sm transition-colors hover:bg-text-primary/35"
        >
          <ShieldAlert size={22} aria-hidden="true" />
          <span className="text-small font-semibold">Mature content — click to reveal</span>
          <span className="inline-flex items-center gap-1 text-caption opacity-80">
            <Eye size={12} aria-hidden="true" />
            This artist tags their sheet 18+ / graphic
          </span>
        </button>
      ) : null}
    </figure>
  )
}

export default SheetImage
