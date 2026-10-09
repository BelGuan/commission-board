import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="shell space-y-8 py-10 sm:py-14">
      <PageHeader eyebrow="404" title="Nothing pinned here" />
      <EmptyState
        icon={Compass}
        title={`No page at ${pathname}`}
        description="The link may be old, or the artist may have changed their handle."
        action={
          <Button as={Link} to="/">
            Back to the feed
          </Button>
        }
      />
    </div>
  )
}

export default NotFoundPage
