import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

export function Lightbox({ images = [], index = 0, onClose, onIndexChange, caption }) {
  const open = index >= 0 && index < images.length
  useLockBodyScroll(open)

  const move = useCallback(
    (step) => {
      if (!images.length) return
      onIndexChange((index + step + images.length) % images.length)
    },
    [images.length, index, onIndexChange],
  )

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') move(1)
      if (event.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, move, onClose])

  if (!open) return null

  const control =
    'inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-text-primary shadow-lift transition-colors hover:bg-surface'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? 'Image viewer'}
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-text-primary/80 p-4"
      onClick={onClose}
    >
      <button type="button" onClick={onClose} aria-label="Close viewer" className={`absolute right-4 top-4 ${control}`}>
        <X size={20} />
      </button>

      {images.length > 1 ? (
        <button
          type="button"
          aria-label="Previous image"
          className={`absolute left-4 ${control}`}
          onClick={(event) => {
            event.stopPropagation()
            move(-1)
          }}
        >
          <ChevronLeft size={20} />
        </button>
      ) : null}

      <figure className="max-h-full" onClick={(event) => event.stopPropagation()}>
        <img
          src={images[index]}
          alt={caption ? `${caption} — ${index + 1} of ${images.length}` : ''}
          className="max-h-[80vh] w-auto rounded-card object-contain shadow-overlay"
        />
        <figcaption className="mt-3 text-center text-caption text-background/80">
          {index + 1} of {images.length}
        </figcaption>
      </figure>

      {images.length > 1 ? (
        <button
          type="button"
          aria-label="Next image"
          className={`absolute right-4 top-1/2 -translate-y-1/2 ${control}`}
          onClick={(event) => {
            event.stopPropagation()
            move(1)
          }}
        >
          <ChevronRight size={20} />
        </button>
      ) : null}
    </div>,
    document.body,
  )
}

export default Lightbox
