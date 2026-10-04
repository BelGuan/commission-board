import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export function Logo({ className, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Commission Board — home"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
        <span className="h-3.5 w-2.5 rounded-[2px] bg-accent-contrast" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-surface bg-text-primary" />
      </span>
      <span className="font-display text-h4 font-semibold leading-none tracking-tight">
        Commission
        <span className="text-accent">Board</span>
      </span>
    </Link>
  )
}

export default Logo
