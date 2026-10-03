import { cn } from '../../lib/cn'

export function Card({ as: Component = 'div', interactive = false, className, ...props }) {
  return (
    <Component
      className={cn(
        'overflow-hidden rounded-card border border-border bg-surface shadow-card',
        interactive &&
          'group block transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift',
        className,
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('border-t border-border bg-surface-muted/60 px-4 py-3 sm:px-5', className)}
      {...props}
    />
  )
}

export default Card
