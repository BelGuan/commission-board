import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { FilterSection } from '../components/filters/FilterSection'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Switch } from '../components/ui/Switch'
import { Checkbox } from '../components/ui/Checkbox'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useMutation } from '../hooks/useMutation'
import { getMyPreferences, updateMe, updateMyPreferences } from '../api/client'

export function SettingsPage() {
  const { user, loading, refresh } = useAuth()
  const { data: saved, refetch } = useAsync(
    () => (user ? getMyPreferences() : null),
    [user?.id],
  )

  const [account, setAccount] = useState({ displayName: '', bio: '', avatarUrl: '' })
  const [showRestricted, setShowRestricted] = useState(false)

  useEffect(() => {
    if (user) {
      setAccount({
        displayName: user.displayName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user])

  useEffect(() => {
    if (saved) setShowRestricted(saved.showRestricted)
  }, [saved])

  const saveAccount = useMutation(updateMe, {
    successMessage: 'Account updated.',
    onSuccess: refresh,
  })

  const saveAge = useMutation(updateMe, {
    successMessage: 'Age verification updated.',
    onSuccess: refresh,
  })

  const savePrefs = useMutation(updateMyPreferences, {
    successMessage: 'Content settings saved.',
    onSuccess: () => refetch(),
  })

  if (loading) {
    return <div className="shell py-16 text-center text-small text-text-muted">Loading…</div>
  }

  if (!user) {
    return (
      <div className="shell max-w-lg space-y-6 py-14">
        <PageHeader eyebrow="Settings" title="Sign in to manage your account" />
        <Button as={Link} to="/login" state={{ from: '/settings' }}>
          Log in
        </Button>
      </div>
    )
  }

  return (
    <div className="shell max-w-2xl space-y-8 py-10 sm:py-14">
      <PageHeader eyebrow="Settings" title="Your account" />

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          saveAccount.mutate(account)
        }}
      >
        <FilterSection title="Profile">
          <div className="space-y-4">
            <Input
              label="Display name"
              value={account.displayName}
              onChange={(e) => setAccount((a) => ({ ...a, displayName: e.target.value }))}
            />
            <Input
              label="Avatar URL"
              value={account.avatarUrl}
              onChange={(e) => setAccount((a) => ({ ...a, avatarUrl: e.target.value }))}
              hint="Upload images from the dashboard; this field takes any URL."
            />
            <div>
              <label htmlFor="settings-bio" className="mb-1.5 block text-small font-medium">
                Bio
              </label>
              <textarea
                id="settings-bio"
                rows={4}
                maxLength={2000}
                value={account.bio}
                onChange={(e) => setAccount((a) => ({ ...a, bio: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface p-3 text-body"
              />
              <p className="mt-1.5 text-caption text-text-muted">
                Markup is stripped server-side — plain text only.
              </p>
            </div>
            <Button type="submit" disabled={saveAccount.pending}>
              {saveAccount.pending ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </FilterSection>
      </form>

      <FilterSection title="Mature content">
        <div className="space-y-4 rounded-card border border-border bg-surface p-4">
          <p className="flex items-start gap-2 text-small text-text-muted">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            Age-restricted artists and images are withheld by the server, not merely hidden in the
            page. Both switches below must be on before any of it is returned to you.
          </p>

          <Checkbox
            label="I am 18 or older"
            description="Stored on your account. Required before mature content can be enabled."
            checked={user.ageVerified}
            onChange={(checked) => saveAge.mutate({ ageVerified: checked })}
          />

          <Switch
            label="Show mature content"
            description={
              user.ageVerified
                ? 'Applies to browsing while signed in.'
                : 'Confirm your age first.'
            }
            checked={showRestricted}
            onChange={(checked) => {
              setShowRestricted(checked)
              savePrefs.mutate({ showRestricted: checked })
            }}
          />
        </div>
      </FilterSection>

      <FilterSection title="Feed preferences">
        <p className="text-small text-text-muted">
          Styles, subjects and budget live in{' '}
          <Link to="/onboarding" className="text-accent underline underline-offset-2">
            the feed tuner
          </Link>
          .
        </p>
      </FilterSection>
    </div>
  )
}

export default SettingsPage
