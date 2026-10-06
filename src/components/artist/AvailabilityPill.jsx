import { CircleDot, Clock, MinusCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { availabilityStatus } from '../../lib/format'

const ICONS = { open: CircleDot, waitlist: Clock, closed: MinusCircle }
const TONES = { success: 'success', warning: 'warning', neutral: 'neutral' }

export function AvailabilityPill({ artist, size = 'md', className }) {
  const status = availabilityStatus(artist)

  return (
    <Badge
      variant={TONES[status.tone]}
      size={size}
      icon={ICONS[status.key]}
      className={className}
    >
      {status.label}
    </Badge>
  )
}

export default AvailabilityPill
