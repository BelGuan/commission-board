import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { FilterPanel } from '../components/filters/FilterPanel'
import { FilterSheet } from '../components/filters/FilterSheet'
import { ActiveFilterChips } from '../components/filters/ActiveFilterChips'
import { NoMatchEmptyState } from '../components/filters/NoMatchEmptyState'
import { ArtistGrid } from '../components/artist/ArtistGrid'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { useArtistFilters } from '../hooks/useArtistFilters'
import { useArtistResults } from '../hooks/useArtistResults'
import { useMatureContent } from '../context/MatureContentContext'
import { clearFacetPatch } from '../lib/filterLabels'
import { SORT_OPTIONS } from '../data/constants'

const PAGE_SIZE = 12

export function BrowsePage() {
  const { filters, setFilter, setFilters, toggleFilter, clearAll, activeCount, queryArgs } =
    useArtistFilters()
  const { toggleRestrictedTag, clearRestricted } = useMatureContent()
  const [sheetOpen, setSheetOpen] = useState(false)

  const { items, total, blockingFilters, error, isInitialLoading, isLoadingMore, hasMore, loadMore } =
    useArtistResults(queryArgs, PAGE_SIZE)

  const removeChip = (chip) => {
    if (chip.facet === 'restrictedTags') return toggleRestrictedTag(chip.value)
    if (['styles', 'commissionTypes', 'contentTags'].includes(chip.facet)) {
      return toggleFilter(chip.facet, chip.value)
    }
    return setFilters(clearFacetPatch(chip.facet))
  }

  const clearFacet = (facet) => {

    if (facet === 'contentTags') clearRestricted()
    setFilters(clearFacetPatch(facet))
  }

  const panelProps = { filters, setFilter, setFilters, toggleFilter, clearAll, activeCount }
  const showEmptyState = !isInitialLoading && !error && items.length === 0

  return (
    <div className="shell py-8 sm:py-10">
      <PageHeader
        eyebrow="Browse"
        title="Find the artist for this specific piece"
        description="Filter by what you actually need — style, type, budget, turnaround — then check who has slots open."
      />

      <div className="mt-8 flex gap-8">
        <aside className="hidden w-72 shrink-0 md:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-1">
            <FilterPanel {...panelProps} matchCount={total} loading={isInitialLoading} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="md:hidden"
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Filters
              {activeCount ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-micro font-semibold text-accent-contrast">
                  {activeCount}
                </span>
              ) : null}
            </Button>

            <p className="text-small text-text-muted" aria-live="polite">
              {isInitialLoading
                ? 'Searching…'
                : `${total} artist${total === 1 ? '' : 's'}${activeCount ? ' match your filters' : ' on the board'}`}
            </p>

            <Select
              aria-label="Sort artists"
              value={filters.sort}
              onChange={(event) => setFilter('sort', event.target.value)}
              options={SORT_OPTIONS}
              containerClassName="w-full max-w-[13rem] sm:w-auto"
            />
          </div>

          <ActiveFilterChips filters={filters} onRemove={removeChip} onClearAll={clearAll} />

          {showEmptyState ? (
            <NoMatchEmptyState
              filters={filters}
              blockingFilters={blockingFilters}
              onClearFacet={clearFacet}
              onClearAll={clearAll}
            />
          ) : (
            <ArtistGrid artists={items} loading={isInitialLoading} error={error} />
          )}

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading…' : `Load more (${total - items.length} left)`}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        matchCount={total}
        loading={isInitialLoading}
        {...panelProps}
      />
    </div>
  )
}

export default BrowsePage
