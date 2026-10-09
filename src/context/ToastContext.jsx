import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../lib/cn'

const ToastContext = createContext(null)
const DISMISS_AFTER = 5000

const TONES = {
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success-muted text-success' },
  error: { icon: AlertCircle, className: 'border-danger/30 bg-danger-muted text-danger' },
  info: { icon: Info, className: 'border-border bg-surface text-text-primary' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, tone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current, { id, message, tone }])
      timers.current.set(id, setTimeout(() => dismiss(id), DISMISS_AFTER))
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),

      error: (error) =>
        push(
          typeof error === 'string'
            ? error
            : (error?.userMessage ?? error?.message ?? 'Something went wrong'),
          'error',
        ),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        >
          {toasts.map(({ id, message, tone }) => {
            const { icon: Icon, className } = TONES[tone] ?? TONES.info
            return (
              <div
                key={id}
                role="status"
                className={cn(
                  'pointer-events-auto flex animate-scale-in items-start gap-2.5 rounded-card border p-3 shadow-lift',
                  className,
                )}
              >
                <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="flex-1 text-small">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss"
                  className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}

export default ToastContext
