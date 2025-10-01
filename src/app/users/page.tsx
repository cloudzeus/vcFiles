import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, Shield, Plus } from "lucide-react"
import UserManagementTable from "@/components/user-management-table"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage users, departments, and company structure
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                All Users
              </CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">24</p>
              <p className="text-sm text-gray-600 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Departments
              </CardTitle>
              <CardDescription>Manage organizational departments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">8</p>
              <p className="text-sm text-gray-600 mt-1">Departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Roles
              </CardTitle>
              <CardDescription>Define and manage user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">12</p>
              <p className="text-sm text-gray-600 mt-1">Role types</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Expand rows to view detailed information and manage users</CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagementTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
