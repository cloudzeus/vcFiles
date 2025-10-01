import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import FilesBrowser from "@/components/files-browser"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function FilesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Files</h1>
            <p className="text-gray-600 mt-2">
              Access and manage your files and folders
            </p>
          </div>
        </div>

        <FilesBrowser user={user} />
      </div>
    </DashboardLayout>
  )
}
