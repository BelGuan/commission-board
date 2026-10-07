import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArtistGrid } from '../components/artist/ArtistGrid'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { SORT_OPTIONS } from '../data/constants'
import { useArtists } from '../hooks/useArtists'

const PAGE_STEP = 12

export function FeedPage() {
  const [sort, setSort] = useState('recommended')
  const [pageSize, setPageSize] = useState(PAGE_STEP)

  const params = useMemo(
    () => ({ sort, page: 1, pageSize, openOnly: false, includeRestricted: false }),
    [sort, pageSize],
  )

  const { artists, total, loading, error, refetch } = useArtists(params)
  const hasMore = !loading && artists.length < total

  return (
    <div className="shell space-y-8 py-8 sm:py-12">
      <PageHeader
        eyebrow="Your feed"
        title="Artists you could book this week"
        description="Commission sheets from illustrators, character designers and VTuber artists — priced, slotted and honest about turnaround."
        actions={
          <Button as={Link} to="/browse" variant="secondary" size="sm">
            Refine with filters
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <p className="text-small text-text-muted" aria-live="polite">
          {loading ? 'Loading the board…' : `${total} artist${total === 1 ? '' : 's'} on the board`}
        </p>
        <Select
          aria-label="Sort artists"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value)
            setPageSize(PAGE_STEP)
          }}
          options={SORT_OPTIONS}
          containerClassName="w-full max-w-[13rem] sm:w-auto"
        />
      </div>

      <ArtistGrid
        artists={artists}
        loading={loading}
        error={error}
        emptyAction={
          <Button variant="secondary" onClick={refetch}>
            Try again
          </Button>
        }
      />

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => setPageSize((size) => size + PAGE_STEP)}>
            Show more artists
          </Button>
        </div>
      ) : null}

      {!loading && !error && artists.length > 0 && !hasMore ? (
        <p className="pt-2 text-center text-caption text-text-subtle">
          That’s everyone matching your feed. Sensitive and 18+ work is hidden until you turn it on
          in{' '}
          <Link to="/settings" className="text-accent underline underline-offset-2">
            settings
          </Link>
          .
        </p>
      ) : null}
    </div>
  )
}

export default FeedPage
