import { cn } from '../../lib/cn'

const VARIANTS = {
  primary:
    'bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-hover shadow-sm',
  secondary:
    'bg-surface text-text-primary border border-border-strong hover:bg-surface-muted active:bg-surface-muted',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-muted hover:text-text-primary',
  danger: 'bg-danger text-accent-contrast hover:bg-danger-hover',
}

const SIZES = {
  sm: 'h-8 px-3 text-small gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-6 text-lead gap-2',
  icon: 'h-10 w-10 justify-center',
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type,
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? (type ?? 'button') : type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}

export default Button
