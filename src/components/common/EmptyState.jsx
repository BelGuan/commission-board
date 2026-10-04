import { Inbox } from 'lucide-react'
import { cn } from '../../lib/cn'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/60 px-6 py-16 text-center',
        className,
      )}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="text-h4">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-small text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export default EmptyState
