import { cn } from '../../lib/cn'

export function Skeleton({ variant = 'line', className, style }) {
  const shape = {
    line: 'h-3 w-full rounded',
    text: 'h-4 w-2/3 rounded',
    circle: 'h-11 w-11 rounded-full',
    block: 'h-32 w-full rounded-lg',
    pill: 'h-5 w-16 rounded-pill',
  }[variant]

  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn('animate-pulse bg-surface-muted', shape, className)}
    />
  )
}

export default Skeleton
