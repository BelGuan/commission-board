import { useState } from 'react'
import { Star } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { cn } from '../../lib/cn'
import { useMutation } from '../../hooks/useMutation'
import { createReview } from '../../api/client'

const MIN_BODY = 30

const AXES = {
  artist: [
    ['quality', 'Quality of the work'],
    ['communication', 'Communication'],
    ['timeliness', 'Delivered on time'],
  ],
  client: [
    ['paid_on_time', 'Paid on time'],
    ['communication', 'Communication'],
    ['respected_boundaries', 'Respected boundaries'],
  ],
}

function Stars({ value, onChange, label }) {
  return (
    <div>
      <span className="mb-1.5 block text-small font-medium text-text-primary">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            aria-pressed={value === n}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={22}
              className={cn(
                n <= value ? 'fill-warning text-warning' : 'text-border-strong',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewModal({ open, onClose, commission, role, onDone }) {

  const subjectType = role === 'artist' ? 'client' : 'artist'
  const subject = role === 'artist' ? commission?.client : commission?.artistUser

  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [subRatings, setSubRatings] = useState({})
  const [wouldWorkAgain, setWouldWorkAgain] = useState(true)

  const { mutate, pending } = useMutation(createReview, {
    successMessage: 'Review posted. Reviews cannot be edited, only retracted within 24 hours.',
    onSuccess: () => {
      onClose()
      onDone?.()
    },
  })

  if (!commission || !subject) return null

  const tooShort = body.trim().length < MIN_BODY

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Review ${subject.displayName}`}
      description={`About "${commission.title}". Reviews are permanent.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="review-form" type="submit" disabled={pending || tooShort}>
            {pending ? 'Posting…' : 'Post review'}
          </Button>
        </>
      }
    >
      <form
        id="review-form"
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          mutate({
            subjectId: subject.id,
            subjectType,
            commissionId: commission.id,
            rating,
            body: body.trim(),
            subRatings,
            wouldWorkAgain: subjectType === 'client' ? wouldWorkAgain : null,
          })
        }}
      >
        <Stars value={rating} onChange={setRating} label="Overall" />

        <div className="space-y-3 rounded-card border border-border bg-surface-muted/50 p-3">
          {AXES[subjectType].map(([key, label]) => (
            <Stars
              key={key}
              label={label}
              value={subRatings[key] ?? 0}
              onChange={(n) => setSubRatings((s) => ({ ...s, [key]: n }))}
            />
          ))}
        </div>

        <div>
          <label htmlFor="review-body" className="mb-1.5 block text-small font-medium">
            What was it like to work with them?
          </label>
          <textarea
            id="review-body"
            rows={5}
            maxLength={5000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface p-3 text-body text-text-primary placeholder:text-text-subtle"
            placeholder="Be specific — communication, timeliness, whether the result matched the sheet."
          />
          <p
            className={cn(
              'mt-1.5 text-caption',
              tooShort ? 'text-text-muted' : 'text-success',
            )}
          >
            {tooShort
              ? `${MIN_BODY - body.trim().length} more characters needed`
              : 'Long enough to be useful.'}
          </p>
        </div>

        {subjectType === 'client' ? (
          <Checkbox
            label="I would work with this client again"
            checked={wouldWorkAgain}
            onChange={setWouldWorkAgain}
          />
        ) : null}
      </form>
    </Modal>
  )
}

export default ReviewModal
