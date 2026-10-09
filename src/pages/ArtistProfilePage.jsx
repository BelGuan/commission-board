import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { UserX } from 'lucide-react'
import { ProfileHeader } from '../components/artist/profile/ProfileHeader'
import { ProfileStats } from '../components/artist/profile/ProfileStats'
import { ProfileTabs } from '../components/artist/profile/ProfileTabs'
import { ProfileSkeleton } from '../components/artist/profile/ProfileSkeleton'
import { CommissionSheetTab } from '../components/artist/profile/CommissionSheetTab'
import { PortfolioTab } from '../components/artist/profile/PortfolioTab'
import { ReviewsTab } from '../components/artist/profile/ReviewsTab'
import { TermsTab } from '../components/artist/profile/TermsTab'
import { RequestCommissionModal } from '../components/artist/profile/RequestCommissionModal'
import { EmptyState } from '../components/common/EmptyState'
import { Button } from '../components/ui/Button'
import { useArtist } from '../hooks/useArtist'

const TAB_COMPONENTS = {
  sheet: CommissionSheetTab,
  portfolio: PortfolioTab,
  reviews: ReviewsTab,
  terms: TermsTab,
}

export function ArtistProfilePage() {
  const { handle } = useParams()
  const { artist, loading, error } = useArtist(handle)

  const [tab, setTab] = useState('sheet')
  const [saved, setSaved] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  if (loading) {
    return (
      <div className="shell py-8">
        <ProfileSkeleton />
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="shell py-14">
        <EmptyState
          icon={UserX}
          title={`No artist at @${handle}`}
          description="They may have changed their handle, or the link is out of date."
          action={
            <Button as={Link} to="/browse">
              Browse the board
            </Button>
          }
        />
      </div>
    )
  }

  const tabs = [
    { id: 'sheet', label: 'Commission Sheet' },
    { id: 'portfolio', label: 'Portfolio', count: artist.portfolioImages.length },
    { id: 'reviews', label: 'Reviews', count: artist.reviewCount || undefined },
    { id: 'terms', label: 'Terms' },
  ]

  const ActiveTab = TAB_COMPONENTS[tab]

  return (
    <div className="shell space-y-6 py-6 sm:py-8">
      <ProfileHeader
        artist={artist}
        saved={saved}
        onToggleSave={() => setSaved((v) => !v)}
        onRequest={() => setRequestOpen(true)}
      />

      <ProfileStats artist={artist} />

      <ProfileTabs tabs={tabs} active={tab} onChange={setTab} />

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="pb-8 pt-2"
      >
        <ActiveTab artist={artist} />
      </div>

      <RequestCommissionModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        artist={artist}
      />
    </div>
  )
}

export default ArtistProfilePage
