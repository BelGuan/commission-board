import { Skeleton } from '../../ui/Skeleton'

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="block" className="h-40 rounded-card sm:h-56" />

      <div className="relative -mt-12 flex flex-col gap-4 px-1 sm:-mt-14 sm:flex-row sm:items-end">
        <Skeleton variant="circle" className="h-24 w-24 ring-2 ring-surface" />
        <div className="flex-1 space-y-2 pb-1">
          <Skeleton variant="text" className="h-6 w-56" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      <div className="space-y-2 px-1">
        <Skeleton className="h-3 w-full max-w-2xl" />
        <Skeleton className="h-3 w-2/3 max-w-lg" />
      </div>

      <Skeleton variant="block" className="h-24 rounded-card" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton variant="block" className="h-80 rounded-card" />
    </div>
  )
}

export default ProfileSkeleton
