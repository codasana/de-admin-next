'use client'

import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">
          Welcome, {user?.first || user?.email}
        </h2>
        <p className="text-muted-foreground">
          This is the Deep English admin dashboard. Select an option from the sidebar to get started.
        </p>
      </div>
    </div>
  )
}
