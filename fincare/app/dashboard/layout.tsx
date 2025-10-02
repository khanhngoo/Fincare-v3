import type React from "react"
import { DashboardSidebar } from "@/components/common/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-0">{children}</main>
    </div>
  )
}
