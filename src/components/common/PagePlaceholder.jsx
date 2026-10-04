import { Construction } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { EmptyState } from './EmptyState'

export function PagePlaceholder({ title, description, milestone = 2, details, actions }) {
  return (
    <div className="shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={`Milestone ${milestone}`}
        title={title}
        description={description}
        actions={actions}
      />
      <EmptyState
        icon={Construction}
        title="Not built yet"
        description={
          details ??
          `This screen is scheduled for frontend milestone ${milestone}. The route, shell and data layer it will use are already in place.`
        }
      />
    </div>
  )
}

export default PagePlaceholder
