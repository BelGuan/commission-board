import { useId } from 'react'
import { cn } from '../../lib/cn'

export function Switch({ label, description, checked = false, onChange, id, className }) {
  const autoId = useId()
  const switchId = id ?? autoId

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="min-w-0">
        <label htmlFor={switchId} className="cursor-pointer text-small font-medium text-text-primary">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-caption text-text-muted">{description}</p> : null}
      </span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors',
          checked ? 'bg-accent' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'inline-block h-4.5 w-4.5 transform rounded-full bg-surface shadow-sm transition-transform',
            'h-[18px] w-[18px]',
            checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  )
}

export default Switch
