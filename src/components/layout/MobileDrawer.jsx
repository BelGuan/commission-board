import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_LINKS } from './navLinks'
import { NavSearch } from './NavSearch'
import { AuthSlot } from './AuthSlot'
import { cn } from '../../lib/cn'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useIsDesktop } from '../../hooks/useMediaQuery'

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-3 text-body font-medium transition-colors',
    isActive ? 'bg-accent-muted text-accent' : 'text-text-primary hover:bg-surface-muted',
  )

export function MobileDrawer({ open, onClose }) {
  const { pathname } = useLocation()
  const isDesktop = useIsDesktop()
  useLockBodyScroll(open)

  useEffect(() => {
    if (open) onClose()

  }, [pathname])

  useEffect(() => {
    if (open && isDesktop) onClose()
  }, [open, isDesktop, onClose])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-text-primary/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm animate-slide-in-right flex-col bg-surface shadow-overlay"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-display text-h4 font-semibold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <NavSearch onSubmitted={onClose} />
        </div>

        <nav aria-label="Mobile" className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <AuthSlot onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default MobileDrawer
