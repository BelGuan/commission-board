import { Check, X } from 'lucide-react'
import { Badge } from '../../ui/Badge'
import { contentTagLabel, CONTENT_TAG_BY_ID } from '../../../data/constants'

function TagGroup({ title, tone, icon: Icon, tagIds = [], emptyText }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h3 className="flex items-center gap-2 text-h4">
        <Icon
          size={16}
          aria-hidden="true"
          className={tone === 'success' ? 'text-success' : 'text-danger'}
        />
        {title}
      </h3>

      {tagIds.length ? (
        <ul className="mt-3 space-y-2">
          {tagIds.map((id) => (
            <li key={id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Badge variant={tone === 'success' ? 'success' : 'neutral'} size="md">
                {contentTagLabel(id)}
              </Badge>
              <span className="text-caption text-text-muted">
                {CONTENT_TAG_BY_ID[id]?.description}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-small text-text-muted">{emptyText}</p>
      )}
    </section>
  )
}

export function TermsTab({ artist }) {
  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-5">
        <h3 className="text-h4">Terms of service</h3>
        <p className="mt-3 max-w-prose text-body leading-relaxed text-text-muted">
          {artist.termsOfService}
        </p>
        <p className="mt-4 border-t border-border pt-4 text-caption text-text-subtle">
          Agreed at the point of booking. Anything not covered here is worth asking about before
          you pay a deposit.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagGroup
          title="Will draw"
          tone="success"
          icon={Check}
          tagIds={artist.contentTags}
          emptyText="No subjects listed — ask before commissioning."
        />
        <TagGroup
          title="Won’t draw"
          tone="danger"
          icon={X}
          tagIds={artist.refusedTags}
          emptyText="Nothing explicitly declined."
        />
      </div>
    </div>
  )
}

export default TermsTab
