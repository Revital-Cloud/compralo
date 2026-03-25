"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui"

const adminSkeletonTone = "bg-gray-200/70 dark:bg-gray-700/45"

function AdminSkeleton({
  className,
}: {
  className?: string
}) {
  return <Skeleton className={cn(adminSkeletonTone, className)} />
}

export function AdminPageHeaderSkeleton({
  showAction = true,
  className,
}: {
  showAction?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-2">
        <AdminSkeleton className="h-8 w-56" />
        <AdminSkeleton className="h-4 w-72" />
      </div>
      {showAction && <AdminSkeleton className="h-9 w-36 rounded-md" />}
    </div>
  )
}

export function AdminStatsRowSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <AdminSkeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function AdminFiltersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <AdminSkeleton className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AdminSkeleton className="h-10 w-full rounded-xl" />
        <AdminSkeleton className="h-10 w-full rounded-xl" />
        <AdminSkeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function AdminTableSkeleton({
  rows = 8,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <AdminSkeleton className="h-10 w-full rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <AdminSkeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

export function AdminFormSkeleton({
  fields = 6,
  className,
}: {
  fields?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <AdminPageHeaderSkeleton showAction={false} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <AdminSkeleton className="h-4 w-32" />
            <AdminSkeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <AdminSkeleton className="h-10 w-28 rounded-md" />
        <AdminSkeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>
  )
}

export function AdminDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <AdminPageHeaderSkeleton showAction={false} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminSkeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        <AdminSkeleton className="h-64 w-full rounded-xl" />
      </div>
      <AdminTableSkeleton rows={5} />
    </div>
  )
}

export function AdminDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <AdminPageHeaderSkeleton showAction={false} />
      <AdminStatsRowSkeleton count={4} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminSkeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        <AdminSkeleton className="h-96 w-full rounded-xl" />
      </div>
      <AdminSkeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

