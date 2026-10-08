import { ShieldAlert, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { describeActiveFilters } from '../../lib/filterLabels'

export function ActiveFilterChips({ filters, onRemove, onClearAll }) {
  const chips = describeActiveFilters(filters)
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-caption text-text-muted">Filtering by</span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip)}
          aria-label={`Remove filter ${chip.label}`}
          className={cn(
            'group inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-caption font-medium transition-colors',
            chip.restricted
              ? 'border-warning/30 bg-warning-muted text-warning hover:border-warning/60'
              : 'border-border bg-surface text-text-primary hover:border-border-strong hover:bg-surface-muted',
          )}
        >
          {chip.restricted ? <ShieldAlert size={11} aria-hidden="true" /> : null}
          {chip.label}
          <X
            size={12}
            aria-hidden="true"
            className="text-text-subtle transition-colors group-hover:text-text-primary"
          />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-caption font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
      >
        Clear all
      </button>
    </div>
  )
}

export default ActiveFilterChips
