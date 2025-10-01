import { getCurrentUser, hasRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Settings, Database, Activity, Lock } from "lucide-react"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()
  
  if (!user || !hasRole(user.role, "ADMINISTRATOR")) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Administrator: {user.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administrator Panel</h1>
          <p className="text-gray-600 mt-2">
            Full system control and management for G-FILES
          </p>
        </div>

        {/* Admin Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                User Management
              </CardTitle>
              <CardDescription>Manage all users, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="text-lg font-semibold text-blue-600">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-lg font-semibold text-green-600">18</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Users
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <span className="text-sm font-semibold text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm font-semibold text-gray-600">2 hours ago</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Configure System
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Security & Access
              </CardTitle>
              <CardDescription>Manage security policies and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Security Level</span>
                  <span className="text-sm font-semibold text-red-600">High</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed Logins</span>
                  <span className="text-sm font-semibold text-orange-600">3 today</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    Security Settings
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Database Management
              </CardTitle>
              <CardDescription>Monitor and manage database operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Size</span>
                  <span className="text-sm font-semibold text-purple-600">2.4 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connections</span>
                  <span className="text-sm font-semibold text-green-600">12 active</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                    Database Tools
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Monitoring */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                System Monitoring
              </CardTitle>
              <CardDescription>Real-time system performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="text-sm font-semibold text-orange-600">23%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-semibold text-green-600">67%</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                    View Metrics
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600" />
                Role Management
              </CardTitle>
              <CardDescription>Define and manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Roles</span>
                  <span className="text-sm font-semibold text-indigo-600">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Custom Permissions</span>
                  <span className="text-sm font-semibold text-green-600">12</span>
                </div>
                <div className="pt-2">
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    Manage Roles
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">Generate Report</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm font-medium text-gray-900">Lock System</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">💾</div>
              <div className="text-sm font-medium text-gray-900">Backup Now</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">📧</div>
              <div className="text-sm font-medium text-gray-900">Send Alert</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
