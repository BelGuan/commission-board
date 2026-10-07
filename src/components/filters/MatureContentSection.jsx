import { useState } from 'react'
import { ChevronDown, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Checkbox } from '../ui/Checkbox'
import { FilterChip } from '../ui/FilterChip'
import { CONTENT_TAGS } from '../../data/constants'
import { useMatureContent } from '../../context/MatureContentContext'

const RESTRICTED_TAGS = CONTENT_TAGS.filter((tag) => tag.restricted)

export function MatureContentSection() {
  const [open, setOpen] = useState(false)
  const { ageConfirmed, restrictedTags, confirmAge, toggleRestrictedTag } = useMatureContent()

  return (
    <section className="rounded-lg border border-border bg-surface-muted/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ShieldAlert size={14} className="text-warning" aria-hidden="true" />
        <span className="text-micro font-semibold uppercase tracking-wider text-text-muted">
          Mature content
        </span>
        {restrictedTags.length ? (
          <span className="rounded-pill bg-warning-muted px-1.5 text-micro font-semibold text-warning">
            {restrictedTags.length}
          </span>
        ) : null}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            'ml-auto text-text-subtle transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <p className="text-caption text-text-muted">
            Off by default. Turning this on applies to this session only — it is never saved and
            never travels in a shared link.
          </p>

          <Checkbox
            label="I am 18 or older"
            description="Required before mature tags can be selected."
            checked={ageConfirmed}
            onChange={confirmAge}
          />

          <div className={cn('flex flex-wrap gap-1.5', !ageConfirmed && 'opacity-60')}>
            {RESTRICTED_TAGS.map((tag) => (
              <FilterChip
                key={tag.id}
                label={tag.label}
                checked={restrictedTags.includes(tag.id)}
                disabled={!ageConfirmed}
                onChange={() => toggleRestrictedTag(tag.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default MatureContentSection
