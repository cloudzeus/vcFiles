import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import CompaniesPageClient from "./companies-page-client"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <CompaniesPageClient />
    </DashboardLayout>
  )
}
