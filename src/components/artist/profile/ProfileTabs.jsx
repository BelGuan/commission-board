import { cn } from '../../../lib/cn'

export function ProfileTabs({ tabs, active, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label="Artist sections" className="flex min-w-max gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative whitespace-nowrap px-4 py-3 text-small font-medium transition-colors',
                isActive
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {tab.label}
              {tab.count != null ? (
                <span className="ml-1.5 text-caption text-text-subtle">{tab.count}</span>
              ) : null}
              {isActive ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-pill bg-accent" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProfileTabs
