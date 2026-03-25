import { AdminPageHeaderSkeleton, AdminFiltersSkeleton, AdminTableSkeleton } from "@/components/admin/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton showAction={false} />
      <AdminFiltersSkeleton />
      <AdminTableSkeleton rows={7} />
    </div>
  )
}

