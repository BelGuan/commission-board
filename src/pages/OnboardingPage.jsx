import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common/PageHeader'
import { ChipGroup } from '../components/filters/ChipGroup'
import { PriceRangeFilter } from '../components/filters/PriceRangeFilter'
import { FilterSection } from '../components/filters/FilterSection'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useMutation } from '../hooks/useMutation'
import { getMyPreferences, updateMyPreferences } from '../api/client'
import { ART_STYLES, COMMISSION_TYPES, CONTENT_TAGS } from '../data/constants'

const OPEN_TAGS = CONTENT_TAGS.filter((tag) => !tag.restricted)

export function OnboardingPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  const { data: saved, loading: loadingPrefs } = useAsync(
    () => (isAuthenticated ? getMyPreferences() : null),
    [isAuthenticated],
  )

  const [prefs, setPrefs] = useState({
    styles: [],
    contentTags: [],
    commissionTypes: [],
    priceMin: null,
    priceMax: null,
  })

  useEffect(() => {
    if (saved) setPrefs((current) => ({ ...current, ...saved }))
  }, [saved])

  const { mutate, pending } = useMutation(updateMyPreferences, {
    successMessage: 'Preferences saved. Your feed is tuned.',
    onSuccess: () => navigate('/'),
  })

  const toggle = (key) => (id) =>
    setPrefs((p) => ({
      ...p,
      [key]: p[key].includes(id) ? p[key].filter((v) => v !== id) : [...p[key], id],
    }))

  if (loading || loadingPrefs) {
    return <div className="shell py-16 text-center text-small text-text-muted">Loading…</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="shell max-w-lg space-y-6 py-14">
        <PageHeader
          eyebrow="Onboarding"
          title="Tune your feed"
          description="Preferences are saved to your account, so you need to be signed in."
        />
        <div className="flex gap-2">
          <Button as={Link} to="/login" state={{ from: '/onboarding' }}>
            Log in
          </Button>
          <Button as={Link} to="/register" variant="secondary">
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  const chosen =
    prefs.styles.length + prefs.contentTags.length + prefs.commissionTypes.length

  return (
    <div className="shell max-w-2xl space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Onboarding"
        title="Tune your feed"
        description="Pick what you actually commission. The Recommended sort scores artists against these — matching styles count most, then subjects, then whether their prices fit your budget."
      />

      <FilterSection title="Styles you like">
        <ChipGroup options={ART_STYLES} selected={prefs.styles} onToggle={toggle('styles')} />
      </FilterSection>

      <FilterSection title="Subjects you commission">
        <ChipGroup
          options={OPEN_TAGS}
          selected={prefs.contentTags}
          onToggle={toggle('contentTags')}
        />
      </FilterSection>

      <FilterSection title="Types of work">
        <ChipGroup
          options={COMMISSION_TYPES}
          selected={prefs.commissionTypes}
          onToggle={toggle('commissionTypes')}
        />
      </FilterSection>

      <FilterSection title="Typical budget">
        <PriceRangeFilter
          priceMin={prefs.priceMin}
          priceMax={prefs.priceMax}
          onChange={(patch) => setPrefs((p) => ({ ...p, ...patch }))}
        />
      </FilterSection>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button size="lg" disabled={pending} onClick={() => mutate(prefs)}>
          {pending ? 'Saving…' : 'Save and see my feed'}
        </Button>
        <Button as={Link} to="/" variant="ghost" size="lg">
          Skip for now
        </Button>
        <span className="text-caption text-text-muted">
          {chosen ? `${chosen} selected` : 'Nothing selected — the feed stays unpersonalised'}
        </span>
      </div>

      <p className="text-caption text-text-subtle">
        Mature content is not here on purpose. It needs age verification, which lives in{' '}
        <Link to="/settings" className="text-accent underline underline-offset-2">
          Settings
        </Link>
        .
      </p>
    </div>
  )
}

export default OnboardingPage
