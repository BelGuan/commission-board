import { SheetImage } from './SheetImage'
import { OfferingsTable } from './OfferingsTable'
import { EmptyState } from '../../common/EmptyState'
import { useAsync } from '../../../hooks/useAsync'
import { getArtistOfferings } from '../../../api/client'

export function CommissionSheetTab({ artist }) {
  const { data: offerings, loading, error } = useAsync(
    () => getArtistOfferings(artist.id),
    [artist.id],
  )

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h3">Commission sheet</h2>
          <span className="text-caption text-text-muted">
            {artist.sheetImages.length} sheet{artist.sheetImages.length === 1 ? '' : 's'}
          </span>
        </div>

        {artist.sheetImages.length ? (
          <div className="mx-auto max-w-2xl space-y-5">
            {artist.sheetImages.map((src, i) => (
              <SheetImage
                key={src}
                src={src}
                alt={`Commission sheet ${i + 1} by ${artist.displayName}`}
                gated={artist.hasRestrictedContent}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sheet posted yet"
            description="This artist hasn’t uploaded a commission sheet image. The priced offerings below still apply."
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-h3">What you can order</h2>
        {error ? (
          <EmptyState
            title="Couldn’t load offerings"
            description={error.message ?? 'Try reloading the page.'}
          />
        ) : (
          <OfferingsTable offerings={offerings ?? []} loading={loading} />
        )}
      </section>
    </div>
  )
}

export default CommissionSheetTab
