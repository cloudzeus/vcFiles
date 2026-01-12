import { getCurrentUser, hasRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Settings, User, ArrowRight, BarChart3, PieChart, Activity } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import RedisStatusCheck from "@/components/redis-status-check"
import FileTypesPieChart from "@/components/charts/file-types-pie-chart"
import ScannedDocumentsRadialChart from "@/components/charts/scanned-documents-radial-chart"
import WeeklyUploadsBarChart from "@/components/charts/weekly-uploads-bar-chart"
import DeletedFilesBarChart from "@/components/charts/deleted-files-bar-chart"
import GenerateFoldersButton from "@/components/generate-folders-button"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  // Ensure user data is valid
  const safeUser = {
    id: user.id || '',
    email: user.email || '',
    name: user.name || '',
    role: user.role || 'USER'
  }

  const isAdmin = hasRole(safeUser.role, "ADMINISTRATOR")
  const isManager = hasRole(safeUser.role, "MANAGER") || isAdmin

  return (
    <DashboardLayout user={safeUser}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your G-FILES dashboard</p>
          <RedisStatusCheck />
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/files">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Files</h3>
                    <p className="text-sm text-gray-600">Manage your files and folders</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/shared">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Shared Items</h3>
                    <p className="text-sm text-gray-600">View shared files and folders</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                    <p className="text-sm text-gray-600">Manage users and permissions</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Chart Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* File Types Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                File Types Distribution
              </CardTitle>
              <CardDescription>Types of files stored in BunnyCDN</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <FileTypesPieChart />
              </div>
            </CardContent>
          </Card>

          {/* Scanned Documents Radial Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Scanned Documents
              </CardTitle>
              <CardDescription>Document scanning progress and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ScannedDocumentsRadialChart />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Uploads Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Weekly Uploads
              </CardTitle>
              <CardDescription>Daily uploads for the current week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <WeeklyUploadsBarChart />
              </div>
            </CardContent>
          </Card>

          {/* Deleted Files Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-600" />
                Deleted Files
              </CardTitle>
              <CardDescription>Number of deleted files per week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <DeletedFilesBarChart />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 capitalize">{safeUser.role || 'User'}</p>
              <p className="text-sm text-gray-600 mt-1">{safeUser.email || 'No email'}</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  View Files
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Upload Files
                </button>
                <a href="/users/profile" className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  View Profile
                </a>
                {isAdmin && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">Create local folders for all departments and users in prismafiles/vculture</p>
                    <GenerateFoldersButton />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">System Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Database Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">Online</p>
              <p className="text-sm text-gray-600 mt-1">You are currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific Content */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Administrator Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage all users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Users
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Configure System
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Role Management
                  </CardTitle>
                  <CardDescription>Define and manage user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Roles
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {isManager && !isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Manager Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Team Overview
                  </CardTitle>
                  <CardDescription>View and manage your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Team
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    Project Management
                  </CardTitle>
                  <CardDescription>Manage team projects and tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Projects
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Employee Content */}
        {!isManager && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Employee Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    My Tasks
                  </CardTitle>
                  <CardDescription>View and manage your assigned tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Tasks
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    File Management
                  </CardTitle>
                  <CardDescription>Access and manage your files</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Files
                    <ArrowRight className="h-4 w-4 ml-2 inline" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
