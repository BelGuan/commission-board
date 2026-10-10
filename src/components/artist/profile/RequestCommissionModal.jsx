import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { useAuth } from '../../../context/AuthContext'
import { useMutation } from '../../../hooks/useMutation'
import { useAsync } from '../../../hooks/useAsync'
import { createCommission, getArtistOfferings } from '../../../api/client'
import { availabilityStatus, formatPrice, formatTurnaround } from '../../../lib/format'

export function RequestCommissionModal({ open, onClose, artist }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const status = availabilityStatus(artist)

  const { data: offerings } = useAsync(() => getArtistOfferings(artist.id), [artist.id])
  const [form, setForm] = useState({ title: '', message: '', offeringId: '' })

  const { mutate, pending } = useMutation(createCommission, {
    successMessage: 'Request sent. You can track it on your dashboard.',
    onSuccess: () => {
      onClose()
      navigate('/dashboard')
    },
  })

  const isOwnProfile = user?.artistProfile?.handle === artist.handle
  const chosen = (offerings ?? []).find((o) => o.id === form.offeringId)

  if (!isAuthenticated) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={`Commission ${artist.displayName}`}
        description="You need an account to send a request."
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button as={Link} to="/login" state={{ from: `/artist/${artist.handle}` }}>
              Log in
            </Button>
          </>
        }
      >
        <p className="text-body text-text-muted">
          Requests are tied to your account so both of you can track the job and review each
          other afterwards.{' '}
          <Link to="/register" className="text-accent underline underline-offset-2">
            Create an account
          </Link>{' '}
          if you do not have one.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request a commission from ${artist.displayName}`}
      description={`${status.label} · typically ${formatTurnaround(artist.turnaroundDays)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            form="commission-request"
            type="submit"
            disabled={pending || isOwnProfile || !form.title.trim()}
          >
            {pending ? 'Sending…' : 'Send request'}
          </Button>
        </>
      }
    >
      {isOwnProfile ? (
        <p className="rounded-lg bg-warning-muted p-3 text-small text-warning">
          This is your own profile — you cannot commission yourself.
        </p>
      ) : null}

      <form
        id="commission-request"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutate({
            artistHandle: artist.handle,
            offeringId: form.offeringId || null,
            title: form.title.trim(),
            message: form.message.trim() || null,
            proposedPrice: chosen ? chosen.priceFrom : null,
          })
        }}
      >
        <Input
          label="What do you want?"
          required
          minLength={3}
          placeholder="Half body of my DnD rogue"
          value={form.title}
          onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
        />

        <Select
          label="Offering (optional)"
          placeholder="Custom — not on the sheet"
          options={(offerings ?? []).map((o) => ({
            id: o.id,
            label: `${o.title} · ${formatPrice(o.priceFrom, o.currency)}`,
          }))}
          value={form.offeringId}
          onChange={(event) => setForm((f) => ({ ...f, offeringId: event.target.value }))}
          hint={
            chosen
              ? `Proposing ${formatPrice(chosen.priceFrom, chosen.currency)}, ${formatTurnaround(chosen.turnaroundDays)} delivery.`
              : 'Pick a line item to propose its price, or leave blank to describe custom work.'
          }
        />

        <div>
          <label
            htmlFor="commission-brief"
            className="mb-1.5 block text-small font-medium text-text-primary"
          >
            Brief
          </label>
          <textarea
            id="commission-brief"
            rows={5}
            maxLength={5000}
            placeholder="References, pose, palette, deadline — anything that helps them quote accurately."
            value={form.message}
            onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
            className="w-full rounded-lg border border-border bg-surface p-3 text-body text-text-primary placeholder:text-text-subtle transition-colors hover:border-border-strong"
          />
          <p className="mt-1.5 text-caption text-text-muted">
            Read their Terms tab first — it is what you are agreeing to.
          </p>
        </div>
      </form>
    </Modal>
  )
}

export default RequestCommissionModal
