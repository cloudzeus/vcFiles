import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import SharedItemsClient from "@/components/shared-items-client"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function SharedItemsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shared Items</h1>
            <p className="text-gray-600 mt-2">
              View and manage files and folders shared with you
            </p>
          </div>
        </div>

        <SharedItemsClient user={user} />
      </div>
    </DashboardLayout>
  )
}

