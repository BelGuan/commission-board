import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/common/PageHeader'
import { ProfileTabs } from '../components/artist/profile/ProfileTabs'
import { CommissionList } from '../components/commissions/CommissionList'
import { ReviewModal } from '../components/reviews/ReviewModal'
import { ArtistProfileForm } from '../components/dashboard/ArtistProfileForm'
import { OfferingsManager } from '../components/dashboard/OfferingsManager'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { listCommissions, updateCommissionStatus } from '../api/client'

export function DashboardPage() {
  const { user, loading, isArtist } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('incoming')
  const [reload, setReload] = useState(0)
  const [pendingId, setPendingId] = useState(null)
  const [reviewing, setReviewing] = useState(null)

  const refresh = useCallback(() => setReload((n) => n + 1), [])

  const incoming = useAsync(
    () => (isArtist ? listCommissions({ role: 'artist' }) : Promise.resolve(null)),
    [isArtist, reload],
  )
  const outgoing = useAsync(
    () => (user ? listCommissions({ role: 'client' }) : Promise.resolve(null)),
    [user?.id, reload],
  )

  const transition = async (commission, status) => {
    setPendingId(commission.id)
    try {
      await updateCommissionStatus(commission.id, status)
      toast.success(`Marked ${status.replace('_', ' ')}.`)
      refresh()
    } catch (error) {
      toast.error(error)
    } finally {
      setPendingId(null)
    }
  }

  if (loading) {
    return <div className="shell py-16 text-center text-small text-text-muted">Loading…</div>
  }

  if (!user) {
    return (
      <div className="shell max-w-lg space-y-6 py-14">
        <PageHeader
          eyebrow="Dashboard"
          title="Sign in to see your commissions"
          description="Your requests, your queue, and the reviews you still owe."
        />
        <div className="flex gap-2">
          <Button as={Link} to="/login" state={{ from: '/dashboard' }}>
            Log in
          </Button>
          <Button as={Link} to="/register" variant="secondary">
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  const tabs = [
    ...(isArtist
      ? [
          { id: 'incoming', label: 'Incoming', count: incoming.data?.total },
          { id: 'sheet', label: 'My sheet' },
          { id: 'offerings', label: 'Offerings' },
        ]
      : []),
    { id: 'outgoing', label: 'My requests', count: outgoing.data?.total },
  ]

  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id

  return (
    <div className="shell space-y-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="Dashboard"
        title={isArtist ? 'Your studio' : 'Your commissions'}
        description={
          isArtist
            ? 'Work coming in, your public sheet, and what you have ordered from others.'
            : 'Everything you have requested, and the reviews you can still leave.'
        }
        actions={
          isArtist && user.artistProfile ? (
            <Button as={Link} to={`/artist/${user.artistProfile.handle}`} variant="secondary" size="sm">
              View public profile
            </Button>
          ) : null
        }
      />

      <ProfileTabs tabs={tabs} active={activeTab} onChange={setTab} />

      <div className="pt-2">
        {activeTab === 'incoming' ? (
          <CommissionList
            role="artist"
            loading={incoming.loading}
            commissions={incoming.data?.items ?? []}
            onTransition={transition}
            onReview={(commission) => setReviewing({ commission, role: 'artist' })}
            pendingId={pendingId}
            emptyTitle="No requests yet"
            emptyDescription="When someone commissions you, it lands here with accept and decline controls."
          />
        ) : null}

        {activeTab === 'outgoing' ? (
          <CommissionList
            role="client"
            loading={outgoing.loading}
            commissions={outgoing.data?.items ?? []}
            onTransition={transition}
            onReview={(commission) => setReviewing({ commission, role: 'client' })}
            pendingId={pendingId}
            emptyTitle="You haven't commissioned anyone yet"
            emptyDescription="Find someone on the board and use “Request a commission” on their profile."
          />
        ) : null}

        {activeTab === 'sheet' ? <ArtistProfileForm /> : null}
        {activeTab === 'offerings' ? <OfferingsManager /> : null}
      </div>

      <ReviewModal
        open={Boolean(reviewing)}
        commission={reviewing?.commission}
        role={reviewing?.role}
        onClose={() => setReviewing(null)}
        onDone={refresh}
      />
    </div>
  )
}

export default DashboardPage
