import { SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/Button'
import { EmptyState } from '../common/EmptyState'
import { describeFacet } from '../../lib/filterLabels'

export function NoMatchEmptyState({ filters, blockingFilters = [], onClearFacet, onClearAll }) {
  if (!blockingFilters.length) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="No artists match these filters"
        description="Nothing on the board fits this combination. Clearing your filters is the fastest way back."
        action={
          <Button variant="secondary" onClick={onClearAll}>
            Clear all filters
          </Button>
        }
      />
    )
  }

  return (
    <div className="rounded-card border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
        <SlidersHorizontal size={22} aria-hidden="true" />
      </span>
      <h3 className="text-h4">No artists match these filters</h3>
      <p className="mx-auto mt-2 max-w-md text-small text-text-muted">
        These are the filters holding the results back. Drop one to see who comes back.
      </p>

      <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2">
        {blockingFilters.map(({ key, unlocks }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left"
          >
            <span className="min-w-0">
              <span className="block truncate text-small font-medium text-text-primary">
                {describeFacet(key, filters)}
              </span>
              <span className="text-caption text-text-muted">
                Removing this shows {unlocks} artist{unlocks === 1 ? '' : 's'}
              </span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => onClearFacet(key)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="ghost" size="sm" onClick={onClearAll} className="mt-4">
        Clear all filters
      </Button>
    </div>
  )
}

export default NoMatchEmptyState
