import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export function FilterChip({ label, checked = false, disabled = false, onChange, className }) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-pill border px-3 py-1.5 text-small font-medium transition-colors',
        checked
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border bg-surface text-text-muted hover:border-border-strong hover:text-text-primary',
        disabled && 'cursor-not-allowed opacity-50 hover:border-border hover:text-text-muted',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background',
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      {checked ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : null}
      {label}
    </label>
  )
}

export default FilterChip
