import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/browse', label: 'Browse artists' },
  { to: '/onboarding', label: 'Set your preferences' },
  { to: '/dashboard', label: 'For artists' },
  { to: '/settings', label: 'Settings' },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-text-muted">
          Commission Board · a board of sheets, not a gallery of finished work.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-caption text-text-muted transition-colors hover:text-text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer
