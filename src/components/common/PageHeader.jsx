import { cn } from '../../lib/cn'

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-micro font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-h2 sm:text-h1">{title}</h1>
        {description ? <p className="mt-2 text-lead text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export default PageHeader
