import { Card, CardBody, CardFooter } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

export function ArtistCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <Skeleton variant="block" className="aspect-[16/10] h-auto rounded-none" />

      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="relative z-10 -mt-9 flex items-end gap-3">
          <Skeleton variant="circle" className="h-16 w-16 ring-2 ring-surface" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <Skeleton className="h-3 w-28" />

        <div className="flex gap-1.5">
          <Skeleton variant="pill" />
          <Skeleton variant="pill" className="w-20" />
          <Skeleton variant="pill" className="w-14" />
        </div>

        <div className="mt-auto flex gap-1.5">
          <Skeleton variant="pill" className="w-24" />
          <Skeleton variant="pill" className="w-16" />
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </CardFooter>
    </Card>
  )
}

export default ArtistCardSkeleton
