import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { EmptyState } from '../common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import {
  createOffering,
  deleteOffering,
  getArtist,
  getArtistOfferings,
  reorderOfferings,
  updateOffering,
} from '../../api/client'
import { COMMISSION_TYPES, commissionTypeLabel } from '../../data/constants'
import { formatPrice } from '../../lib/format'

const BLANK = { type: 'bust', title: '', description: '', priceFrom: 50, turnaroundDays: 14, revisions: 1 }

export function OfferingsManager() {
  const { user } = useAuth()
  const toast = useToast()
  const handle = user?.artistProfile?.handle

  const [reload, setReload] = useState(0)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data: offerings, loading } = useAsync(async () => {
    if (!handle) return []
    const artist = await getArtist(handle)
    return getArtistOfferings(artist.id)
  }, [handle, reload])

  const refresh = () => setReload((n) => n + 1)

  const run = async (work, message) => {
    setBusy(true)
    try {
      await work()
      toast.success(message)
      refresh()
    } catch (error) {
      toast.error(error)
    } finally {
      setBusy(false)
    }
  }

  const move = (index, delta) => {
    const next = [...(offerings ?? [])]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    run(() => reorderOfferings(next.map((o) => o.id)), 'Order saved.')
  }

  if (loading) {
    return <div className="py-10 text-center text-small text-text-muted">Loading offerings…</div>
  }

  const rows = offerings ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-text-muted">
          {rows.length} line item{rows.length === 1 ? '' : 's'} on your sheet
        </p>
        <Button size="sm" onClick={() => setDraft({ ...BLANK })} disabled={busy || Boolean(draft)}>
          <Plus size={15} aria-hidden="true" />
          Add an offering
        </Button>
      </div>

      {draft ? (
        <form
          className="space-y-3 rounded-card border border-accent/30 bg-accent-muted/40 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            run(
              () => createOffering({ ...draft, sortOrder: rows.length }),
              'Offering added.',
            ).then(() => setDraft(null))
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              options={COMMISSION_TYPES}
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
            />
            <Input
              label="Title"
              required
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <Input
              label="Price"
              type="number"
              min={0}
              value={draft.priceFrom}
              onChange={(e) => setDraft((d) => ({ ...d, priceFrom: Number(e.target.value) }))}
            />
            <Input
              label="Delivery (days)"
              type="number"
              min={1}
              value={draft.turnaroundDays}
              onChange={(e) => setDraft((d) => ({ ...d, turnaroundDays: Number(e.target.value) }))}
            />
            <Input
              label="Revisions included"
              type="number"
              min={0}
              value={draft.revisions}
              onChange={(e) => setDraft((d) => ({ ...d, revisions: Number(e.target.value) }))}
            />
          </div>
          <Input
            label="Description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Saving…' : 'Save offering'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {rows.length ? (
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {rows.map((offering, index) => (
            <li key={offering.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-muted">
                  {commissionTypeLabel(offering.type)}
                </p>
                <h4 className="truncate text-h4">{offering.title}</h4>
                <p className="text-caption text-text-muted">
                  {formatPrice(offering.priceFrom)} · {offering.turnaroundDays} days ·{' '}
                  {offering.revisions} revision{offering.revisions === 1 ? '' : 's'}
                </p>
              </div>

              <Input
                aria-label={`Price for ${offering.title}`}
                type="number"
                min={0}
                defaultValue={offering.priceFrom}
                containerClassName="w-28"
                onBlur={(event) => {
                  const price = Number(event.target.value)
                  if (price !== offering.priceFrom) {
                    run(() => updateOffering(offering.id, { priceFrom: price }), 'Price updated.')
                  }
                }}
              />

              <div className="flex gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp size={15} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || index === rows.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown size={15} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  className="text-danger"
                  onClick={() => run(() => deleteOffering(offering.id), 'Offering deleted.')}
                  aria-label="Delete offering"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No offerings yet"
          description="Line items are what clients pick from when they request a commission."
        />
      )}
    </div>
  )
}

export default OfferingsManager
