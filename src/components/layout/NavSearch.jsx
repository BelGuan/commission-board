import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { SearchResultRow } from '../search/SearchResultRow'
import { useArtistSearch } from '../../hooks/useArtistSearch'
import { cn } from '../../lib/cn'

const MAX_RESULTS = 5

export function NavSearch({ className, autoFocus = false, onSubmitted }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const listboxId = useId()

  const [value, setValue] = useState(params.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)

  const { results, total, loading, isTooShort } = useArtistSearch(value, { limit: MAX_RESULTS })

  const [seenResults, setSeenResults] = useState(results)
  if (seenResults !== results) {
    setSeenResults(results)
    setActiveIndex(-1)
  }

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const goToArtist = (artist) => {
    close()
    onSubmitted?.()
    navigate(`/artist/${artist.handle}`)
  }

  const runFullSearch = () => {
    const q = value.trim()
    close()
    onSubmitted?.()
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') return close()

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return undefined
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1

      setActiveIndex((current) => {
        const next = current + step
        if (next < -1) return results.length - 1
        if (next >= results.length) return -1
        return next
      })
      return undefined
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (open && activeIndex >= 0 && results[activeIndex]) return goToArtist(results[activeIndex])
      return runFullSearch()
    }

    return undefined
  }

  const showDropdown = open && !isTooShort
  const activeId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            aria-label="Search artists, styles or handles"
            placeholder="Search artists, styles, @handles…"
            className="h-10 w-full rounded-lg border border-border bg-surface-muted/70 pl-9 pr-9 text-body text-text-primary placeholder:text-text-subtle transition-colors hover:border-border-strong focus:bg-surface"
          />
          {loading ? (
            <Loader2
              size={15}
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-subtle"
            />
          ) : null}
        </div>
      </form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-lift">
          <ul id={listboxId} role="listbox" aria-label="Artist results">
            {results.map((artist, index) => (
              <SearchResultRow
                key={artist.id}
                id={`${listboxId}-option-${index}`}
                artist={artist}
                active={index === activeIndex}
                onSelect={goToArtist}
                onHover={() => setActiveIndex(index)}
              />
            ))}
          </ul>

          {!loading && !results.length ? (
            <p className="px-3 py-4 text-center text-caption text-text-muted">
              No artists match “{value.trim()}”.
            </p>
          ) : null}

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={runFullSearch}
            className="block w-full border-t border-border bg-surface-muted/50 px-3 py-2.5 text-left text-caption font-medium text-accent hover:bg-surface-muted"
          >
            {total > results.length
              ? `See all ${total} results for “${value.trim()}”`
              : `Search the board for “${value.trim()}”`}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default NavSearch
