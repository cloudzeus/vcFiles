import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Shield,
  Users
} from "lucide-react"

import { prisma } from "@/lib/prisma"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function UserProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  // Fetch user with department relationships and roles
  const userWithDetails = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userDepartments: {
        where: { leftAt: null }, // Only active relationships
        include: {
          department: {
            select: {
              id: true,
              name: true,
              description: true,
              email: true
            }
          }
        }
      },
      managedDepartments: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  })

  if (!userWithDetails) {
    redirect("/auth/signin")
  }

  // Ensure user object has all required properties
  if (!userWithDetails.id || !userWithDetails.email) {
    redirect("/auth/signin")
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'bg-red-100 text-red-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'EMPLOYEE': return 'bg-green-100 text-green-800'
      case 'COLLABORATOR': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-2">Your personal information and department details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{userWithDetails.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{userWithDetails.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <Badge className={getRoleColor(userWithDetails.role)}>
                      {userWithDetails.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900">{userWithDetails.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Office Phone</label>
                      <p className="text-gray-900">{userWithDetails.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mobile</label>
                      <p className="text-gray-900">{userWithDetails.mobile || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Extension</label>
                      <p className="text-gray-900">{userWithDetails.extension || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Street Address</label>
                      <p className="text-gray-900">{userWithDetails.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">City</label>
                      <p className="text-gray-900">{userWithDetails.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                      <p className="text-gray-900">{userWithDetails.zip || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Country</label>
                      <p className="text-gray-900">{userWithDetails.country || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Department Memberships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Department Memberships
                </CardTitle>
                <CardDescription>Your current department roles</CardDescription>
              </CardHeader>
              <CardContent>
                {userWithDetails.userDepartments.length > 0 ? (
                  <div className="space-y-3">
                    {userWithDetails.userDepartments.map((userDept) => (
                      <div key={userDept.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">{userDept.department.name}</div>
                        <div className="text-sm text-blue-700">{userDept.jobPosition}</div>
                        {userDept.isManager && (
                          <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">
                            Manager
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No department memberships</p>
                )}
              </CardContent>
            </Card>

            {/* Managed Departments */}
            {userWithDetails.managedDepartments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Managed Departments
                  </CardTitle>
                  <CardDescription>Departments you manage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userWithDetails.managedDepartments.map((dept) => (
                      <div key={dept.id} className="p-2 bg-green-50 rounded text-sm">
                        <div className="font-medium text-green-900">{dept.name}</div>
                        {dept.description && (
                          <div className="text-green-700">{dept.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Departments</span>
                    <Badge variant="outline">{userWithDetails.userDepartments.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Managing</span>
                    <Badge variant="outline">{userWithDetails.managedDepartments.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm text-gray-900">
                      {userWithDetails.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
