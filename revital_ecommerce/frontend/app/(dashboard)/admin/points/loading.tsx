import { AdminPageHeaderSkeleton, AdminFiltersSkeleton, AdminTableSkeleton } from "@/components/admin/skeletons"

export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <AdminFiltersSkeleton />
      <AdminTableSkeleton rows={10} />
    </div>
  )
}

