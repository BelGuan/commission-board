import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { FilterPanel } from './FilterPanel'
import { Button } from '../ui/Button'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useIsDesktop } from '../../hooks/useMediaQuery'

export function FilterSheet({ open, onClose, matchCount, loading, ...panelProps }) {
  const isDesktop = useIsDesktop()
  useLockBodyScroll(open)

  useEffect(() => {
    if (open && isDesktop) onClose()
  }, [open, isDesktop, onClose])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-text-primary/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 top-12 flex animate-scale-in flex-col rounded-t-card bg-surface shadow-overlay"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="font-display text-h4 font-semibold">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel matchCount={matchCount} loading={loading} {...panelProps} />
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <Button fullWidth size="lg" onClick={onClose}>
            {loading ? 'Loading…' : `Show ${matchCount} artist${matchCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default FilterSheet
