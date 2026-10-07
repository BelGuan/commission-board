import { FilterSection } from './FilterSection'
import { ChipGroup } from './ChipGroup'
import { PriceRangeFilter } from './PriceRangeFilter'
import { MatureContentSection } from './MatureContentSection'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Switch'
import { cn } from '../../lib/cn'
import {
  ART_STYLES,
  COMMISSION_TYPES,
  CONTENT_TAGS,
  TURNAROUND_OPTIONS,
} from '../../data/constants'

const OPEN_TAGS = CONTENT_TAGS.filter((tag) => !tag.restricted)

export function FilterPanel({
  filters,
  setFilter,
  setFilters,
  toggleFilter,
  clearAll,
  activeCount,
  matchCount,
  loading,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-small font-medium text-text-primary" aria-live="polite">
          {loading ? (
            <span className="text-text-muted">Counting…</span>
          ) : (
            <>
              {matchCount} <span className="text-text-muted">artist{matchCount === 1 ? '' : 's'} match</span>
            </>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={!activeCount}
          className={cn(!activeCount && 'opacity-40')}
        >
          Clear all
        </Button>
      </div>

      <FilterSection title="Art style">
        <ChipGroup
          options={ART_STYLES}
          selected={filters.styles}
          onToggle={(id) => toggleFilter('styles', id)}
        />
      </FilterSection>

      <FilterSection title="Commission type">
        <ChipGroup
          options={COMMISSION_TYPES}
          selected={filters.commissionTypes}
          onToggle={(id) => toggleFilter('commissionTypes', id)}
        />
      </FilterSection>

      <FilterSection title="Price range">
        <PriceRangeFilter
          priceMin={filters.priceMin}
          priceMax={filters.priceMax}
          onChange={(patch) => setFilters(patch)}
        />
      </FilterSection>

      <FilterSection title="Turnaround">
        <div className="grid grid-cols-2 gap-1.5">
          {TURNAROUND_OPTIONS.map((option) => {
            const active = filters.turnaround === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter('turnaround', option.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-small font-medium transition-colors',
                  active
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-border bg-surface text-text-muted hover:border-border-strong hover:text-text-primary',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Content tags">
        <ChipGroup
          options={OPEN_TAGS}
          selected={filters.contentTags}
          onToggle={(id) => toggleFilter('contentTags', id)}
        />
      </FilterSection>

      <MatureContentSection />

      <FilterSection title="Availability">
        <Switch
          label="Only show artists with open slots"
          description="Hides closed books and full waitlists."
          checked={filters.openOnly}
          onChange={(checked) => setFilter('openOnly', checked)}
        />
      </FilterSection>
    </div>
  )
}

export default FilterPanel
