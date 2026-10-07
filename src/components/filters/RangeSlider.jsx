import { useCallback, useRef } from 'react'
import { cn } from '../../lib/cn'

const clamp = (value, low, high) => Math.min(Math.max(value, low), high)

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v,
  label = 'Range',
}) {
  const trackRef = useRef(null)
  const activeHandleRef = useRef(null)
  const [low, high] = value

  const toPercent = useCallback((v) => ((v - min) / (max - min)) * 100, [min, max])

  const valueFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current
      if (!track) return min
      const rect = track.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
      const raw = min + ratio * (max - min)
      return clamp(Math.round(raw / step) * step, min, max)
    },
    [min, max, step],
  )

  const commit = useCallback(
    (handle, next) => {
      if (handle === 'low') onChange([Math.min(next, high), high])
      else onChange([low, Math.max(next, low)])
    },
    [low, high, onChange],
  )

  const handlePointerDown = (handle) => (event) => {
    event.preventDefault()
    activeHandleRef.current = handle
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
  }

  const handlePointerMove = (event) => {
    if (!activeHandleRef.current) return
    commit(activeHandleRef.current, valueFromClientX(event.clientX))
  }

  const handlePointerUp = (event) => {
    activeHandleRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const handleTrackPointerDown = (event) => {
    const next = valueFromClientX(event.clientX)
    const handle = Math.abs(next - low) <= Math.abs(next - high) ? 'low' : 'high'
    commit(handle, next)
  }

  const handleKeyDown = (handle) => (event) => {
    const current = handle === 'low' ? low : high
    const bigStep = step * 10
    const moves = {
      ArrowLeft: current - step,
      ArrowDown: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      PageDown: current - bigStep,
      PageUp: current + bigStep,
      Home: min,
      End: max,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    commit(handle, clamp(next, min, max))
  }

  const handleProps = (handle, current, ariaLabel) => ({
    role: 'slider',
    tabIndex: 0,
    'aria-label': ariaLabel,
    'aria-valuemin': handle === 'low' ? min : low,
    'aria-valuemax': handle === 'low' ? high : max,
    'aria-valuenow': current,
    'aria-valuetext': formatValue(current),
    onPointerDown: handlePointerDown(handle),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onKeyDown: handleKeyDown(handle),
    style: { left: `${toPercent(current)}%` },
    className: cn(
      'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full',
      'border-2 border-accent bg-surface shadow-sm transition-transform',
      'hover:scale-110 active:scale-105 active:cursor-grabbing touch-none',
    ),
  })

  return (
    <div className="px-2.5 py-3" aria-label={label}>
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        className="relative h-1.5 w-full cursor-pointer rounded-pill bg-surface-muted"
      >
        <div
          className="absolute h-full rounded-pill bg-accent"
          style={{ left: `${toPercent(low)}%`, width: `${toPercent(high) - toPercent(low)}%` }}
        />
        <div {...handleProps('low', low, `Minimum ${label.toLowerCase()}`)} />
        <div {...handleProps('high', high, `Maximum ${label.toLowerCase()}`)} />
      </div>
    </div>
  )
}

export default RangeSlider
