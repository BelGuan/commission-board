import { cn } from '../../lib/cn'

const VARIANTS = {
  neutral: 'bg-surface-muted text-text-muted border-border',
  accent: 'bg-accent-muted text-accent border-accent/20',
  warning: 'bg-warning-muted text-warning border-warning/25',
  success: 'bg-success-muted text-success border-success/25',
  danger: 'bg-danger-muted text-danger border-danger/25',
}

const SIZES = {
  sm: 'h-5 px-1.5 text-micro',
  md: 'h-6 px-2 text-caption',
}

export function Badge({ variant = 'neutral', size = 'sm', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-pill border font-medium',
        VARIANTS[variant] ?? VARIANTS.neutral,
        SIZES[size] ?? SIZES.sm,
        className,
      )}
    >
      {Icon ? <Icon size={12} strokeWidth={2.25} className="shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

export const Tag = Badge

export default Badge
