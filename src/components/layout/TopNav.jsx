import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from './Logo'
import { NavSearch } from './NavSearch'
import { MobileDrawer } from './MobileDrawer'
import { NAV_LINKS } from './navLinks'
import { AuthSlot } from './AuthSlot'
import { cn } from '../../lib/cn'

const linkClass = ({ isActive }) =>
  cn(
    'rounded-lg px-3 py-2 text-small font-medium transition-colors',
    isActive
      ? 'bg-surface-muted text-text-primary'
      : 'text-text-muted hover:bg-surface-muted hover:text-text-primary',
  )

export function TopNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="shell flex h-16 items-center gap-3">
          <Logo />

          <NavSearch className="ml-2 hidden max-w-md flex-1 md:block" />

          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-2 hidden items-center gap-2 border-l border-border pl-3 md:flex">
            <AuthSlot />
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopNav
