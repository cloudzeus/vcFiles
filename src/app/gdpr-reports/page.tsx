import { getCurrentUser, hasRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import GdprReportsClient from "@/components/gdpr-reports-client"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function GdprReportsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  // Check if user has permission to view GDPR reports
  if (!hasRole(user.role, 'ADMINISTRATOR') && !hasRole(user.role, 'MANAGER')) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance Reports</h1>
            <p className="text-gray-600 mt-2">
              Monitor and analyze GDPR compliance across file sharing activities
            </p>
          </div>
        </div>

        <GdprReportsClient user={user} />
      </div>
    </DashboardLayout>
  )
}

