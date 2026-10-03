import { useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Checkbox({ label, description, checked = false, onChange, id, className }) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-border-strong bg-surface transition-colors checked:border-accent checked:bg-accent"
        />
        <Check
          size={12}
          strokeWidth={3.5}
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 text-accent-contrast opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="min-w-0">
        <label htmlFor={inputId} className="cursor-pointer text-small font-medium text-text-primary">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-caption text-text-muted">{description}</p> : null}
      </span>
    </div>
  )
}

export default Checkbox
