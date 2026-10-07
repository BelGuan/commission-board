import { useState } from 'react'
import { RangeSlider } from './RangeSlider'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import { formatPrice } from '../../lib/format'
import { PRICE_BRACKETS, PRICE_CEILING, PRICE_FLOOR, PRICE_STEP } from '../../data/constants'

export function PriceRangeFilter({ priceMin, priceMax, onChange }) {
  const low = priceMin ?? PRICE_FLOOR
  const high = priceMax ?? PRICE_CEILING

  const [draft, setDraft] = useState({ low: String(low), high: String(high) })
  const [seenBounds, setSeenBounds] = useState([low, high])
  if (seenBounds[0] !== low || seenBounds[1] !== high) {
    setSeenBounds([low, high])
    setDraft({ low: String(low), high: String(high) })
  }

  const commit = ([nextLow, nextHigh]) => {
    onChange({
      priceMin: nextLow <= PRICE_FLOOR ? null : nextLow,
      priceMax: nextHigh >= PRICE_CEILING ? null : nextHigh,
    })
  }

  const commitDraft = () => {
    const parsedLow = Number(draft.low)
    const parsedHigh = Number(draft.high)
    const nextLow = Number.isFinite(parsedLow) ? parsedLow : PRICE_FLOOR
    const nextHigh = Number.isFinite(parsedHigh) ? parsedHigh : PRICE_CEILING
    const bounded = [
      Math.min(Math.max(nextLow, PRICE_FLOOR), PRICE_CEILING),
      Math.min(Math.max(nextHigh, PRICE_FLOOR), PRICE_CEILING),
    ].sort((a, b) => a - b)
    commit(bounded)
  }

  const isPresetActive = (bracket) =>
    (bracket.min === PRICE_FLOOR ? priceMin == null : priceMin === bracket.min) &&
    (bracket.max == null ? priceMax == null : priceMax === bracket.max)

  const applyPreset = (bracket) => {
    if (isPresetActive(bracket)) return onChange({ priceMin: null, priceMax: null })
    return onChange({
      priceMin: bracket.min === PRICE_FLOOR ? null : bracket.min,
      priceMax: bracket.max,
    })
  }

  return (
    <div className="space-y-3">
      <RangeSlider
        label="Price"
        min={PRICE_FLOOR}
        max={PRICE_CEILING}
        step={PRICE_STEP}
        value={[low, high]}
        onChange={commit}
        formatValue={(v) => formatPrice(v)}
      />

      <div className="flex items-center gap-2">
        {['low', 'high'].map((side, i) => (
          <div key={side} className="relative flex-1">
            {i === 1 ? (
              <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-caption text-text-subtle">
                –
              </span>
            ) : null}
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-text-subtle">
              $
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={PRICE_FLOOR}
              max={PRICE_CEILING}
              step={PRICE_STEP}
              aria-label={side === 'low' ? 'Minimum price' : 'Maximum price'}
              value={draft[side]}
              onChange={(event) => setDraft((d) => ({ ...d, [side]: event.target.value }))}
              onBlur={commitDraft}
              onKeyDown={(event) => event.key === 'Enter' && commitDraft()}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-5 pr-2 text-small text-text-primary transition-colors hover:border-border-strong"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRICE_BRACKETS.map((bracket) => (
          <Button
            key={bracket.id}
            size="sm"
            variant={isPresetActive(bracket) ? 'primary' : 'secondary'}
            onClick={() => applyPreset(bracket)}
            className={cn('rounded-pill', !isPresetActive(bracket) && 'border-border')}
          >
            {bracket.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default PriceRangeFilter
