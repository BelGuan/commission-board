import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { FIELD_CLASSES } from './Input'

export function Select({
  label,
  hint,
  options = [],
  placeholder,
  className,
  containerClassName,
  id,
  ...props
}) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <div className={cn('w-full', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-small font-medium text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          className={cn(FIELD_CLASSES, 'h-10 appearance-none pl-3 pr-9', className)}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle"
        />
      </div>

      {hint ? <p className="mt-1.5 text-caption text-text-muted">{hint}</p> : null}
    </div>
  )
}

export default Select
