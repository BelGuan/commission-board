import { useId } from 'react'
import { cn } from '../../lib/cn'

const FIELD =
  'w-full rounded-lg border border-border bg-surface text-body text-text-primary placeholder:text-text-subtle transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle'

export function Input({
  label,
  hint,
  error,
  icon: Icon,
  className,
  containerClassName,
  id,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={cn('w-full', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-small font-medium text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            FIELD,
            'h-10 px-3',
            Icon && 'pl-9',
            error && 'border-danger hover:border-danger',
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-caption text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export { FIELD as FIELD_CLASSES }
export default Input
