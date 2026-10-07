import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

export function FilterSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  icon: Icon,
  className,
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <section className={cn('space-y-3', className)}>
        <h3 className="text-micro font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
        {children}
      </section>
    )
  }

  return (
    <section className={cn('space-y-3', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        {Icon ? <Icon size={14} className="text-text-muted" aria-hidden="true" /> : null}
        <span className="text-micro font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            'ml-auto text-text-subtle transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? children : null}
    </section>
  )
}

export default FilterSection
