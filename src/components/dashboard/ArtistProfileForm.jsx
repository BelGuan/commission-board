import { useEffect, useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Switch'
import { ChipGroup } from '../filters/ChipGroup'
import { FilterSection } from '../filters/FilterSection'
import { ImageManager } from './ImageManager'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useMutation } from '../../hooks/useMutation'
import { getArtist, upsertMyArtistProfile } from '../../api/client'
import { ART_STYLES, COMMISSION_TYPES, CONTENT_TAGS } from '../../data/constants'

const OPEN_TAGS = CONTENT_TAGS.filter((tag) => !tag.restricted)

export function ArtistProfileForm() {
  const { user, refresh } = useAuth()
  const handle = user?.artistProfile?.handle

  const { data: artist, loading, refetch } = useAsync(
    () => (handle ? getArtist(handle) : null),
    [handle],
  )

  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!artist) return
    setForm({
      tagline: artist.tagline ?? '',
      bio: artist.bio ?? '',
      location: artist.location ?? '',
      languages: (artist.languages ?? []).join(', '),
      termsOfService: artist.termsOfService ?? '',
      isOpen: artist.isOpen,
      slotsOpen: artist.slotsOpen,
      slotsTotal: artist.slotsTotal,
      turnaroundDays: artist.turnaroundDays,
      priceMin: artist.priceMin ?? 0,
      priceMax: artist.priceMax ?? 0,
      styles: artist.styles ?? [],
      contentTags: artist.contentTags ?? [],
      commissionTypes: artist.commissionTypes ?? [],
    })
  }, [artist])

  const { mutate, pending } = useMutation(upsertMyArtistProfile, {
    successMessage: 'Your sheet is updated.',
    onSuccess: async () => {
      await refresh()
      refetch()
    },
  })

  if (loading || !form) {
    return <div className="py-10 text-center text-small text-text-muted">Loading your sheet…</div>
  }

  const set = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: event.target.value }))
  const setNumber = (key) => (event) =>
    setForm((f) => ({ ...f, [key]: Number(event.target.value) }))
  const toggle = (key) => (id) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((v) => v !== id) : [...f[key], id],
    }))

  return (
    <div className="space-y-8">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          mutate({
            handle,
            tagline: form.tagline,
            bio: form.bio,
            location: form.location,
            languages: form.languages
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean),
            termsOfService: form.termsOfService,
            isOpen: form.isOpen,
            slotsOpen: form.slotsOpen,
            slotsTotal: form.slotsTotal,
            turnaroundDays: form.turnaroundDays,
            priceMin: form.priceMin,
            priceMax: form.priceMax,

            tagSlugs: [...form.styles, ...form.contentTags, ...form.commissionTypes],
          })
        }}
      >
        <FilterSection title="Who you are">
          <div className="space-y-4">
            <Input label="Tagline" value={form.tagline} onChange={set('tagline')} maxLength={200} />
            <div>
              <label htmlFor="bio" className="mb-1.5 block text-small font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                maxLength={2000}
                value={form.bio}
                onChange={set('bio')}
                className="w-full rounded-lg border border-border bg-surface p-3 text-body"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Location" value={form.location} onChange={set('location')} />
              <Input
                label="Languages"
                value={form.languages}
                onChange={set('languages')}
                hint="Comma separated."
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Availability and pricing">
          <div className="space-y-4">
            <Switch
              label="Open for commissions"
              description="Turning this off hides you from the open-only filter."
              checked={form.isOpen}
              onChange={(checked) => setForm((f) => ({ ...f, isOpen: checked }))}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Slots open"
                type="number"
                min={0}
                value={form.slotsOpen}
                onChange={setNumber('slotsOpen')}
              />
              <Input
                label="Slots total"
                type="number"
                min={0}
                value={form.slotsTotal}
                onChange={setNumber('slotsTotal')}
              />
              <Input
                label="Turnaround (days)"
                type="number"
                min={1}
                value={form.turnaroundDays}
                onChange={setNumber('turnaroundDays')}
              />
              <div />
              <Input
                label="Lowest price"
                type="number"
                min={0}
                value={form.priceMin}
                onChange={setNumber('priceMin')}
              />
              <Input
                label="Highest price"
                type="number"
                min={0}
                value={form.priceMax}
                onChange={setNumber('priceMax')}
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Styles">
          <ChipGroup options={ART_STYLES} selected={form.styles} onToggle={toggle('styles')} />
        </FilterSection>

        <FilterSection title="Subjects you draw">
          <ChipGroup
            options={OPEN_TAGS}
            selected={form.contentTags}
            onToggle={toggle('contentTags')}
          />
        </FilterSection>

        <FilterSection title="Types of work you take">
          <ChipGroup
            options={COMMISSION_TYPES}
            selected={form.commissionTypes}
            onToggle={toggle('commissionTypes')}
          />
        </FilterSection>

        <FilterSection title="Terms of service">
          <textarea
            rows={6}
            maxLength={10000}
            value={form.termsOfService}
            onChange={set('termsOfService')}
            className="w-full rounded-lg border border-border bg-surface p-3 text-body"
            placeholder="Deposit, revisions, licensing, what you will and will not take on."
          />
        </FilterSection>

        <div className="border-t border-border pt-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Saving…' : 'Save sheet'}
          </Button>
        </div>
      </form>

      <ImageManager kind="sheet" artist={artist} onChanged={refetch} />
      <ImageManager kind="portfolio" artist={artist} onChanged={refetch} />
    </div>
  )
}

export default ArtistProfileForm
