import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, TrendingUp, Plus, Edit, Trash2, MapPin } from "lucide-react"
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

// Fetch company structure data
async function getCompanyStructureData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/company-structure`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch company structure data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching company structure:', error);
    return {
      departments: [],
      statistics: {
        totalDepartments: 0,
        totalEmployees: 0,
        totalRoles: 0,
        totalLocations: 0,
      },
      locations: [],
    };
  }
}

export default async function CompanyStructurePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  const companyData = await getCompanyStructureData()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Structure</h1>
            <p className="text-gray-600 mt-2">
              Visualize and manage your organizational hierarchy
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Position
          </button>
        </div>

        {/* Company Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companyData.statistics.totalDepartments}</p>
                  <p className="text-sm text-gray-600">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companyData.statistics.totalEmployees}</p>
                  <p className="text-sm text-gray-600">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companyData.statistics.totalRoles}</p>
                  <p className="text-sm text-gray-600">Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companyData.statistics.totalLocations}</p>
                  <p className="text-sm text-gray-600">Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizational Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Organizational Hierarchy</CardTitle>
            <CardDescription>Current company structure and reporting relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<OrganizationChartSkeleton />}>
              <OrganizationChart departments={companyData.departments} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Department Details */}
        <Suspense fallback={<DepartmentDetailsSkeleton />}>
          <DepartmentDetails departments={companyData.departments} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

// Organization Chart Component
function OrganizationChart({ departments }: { departments: any[] }) {
  // Group departments by hierarchy level
  const topLevelDepartments = departments.filter(dept => !dept.parentId);
  const childDepartments = departments.filter(dept => dept.parentId);

  if (departments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No departments found. Add departments to see the organizational structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Level Departments */}
      <div className="flex justify-center gap-4 flex-wrap">
        {topLevelDepartments.map((dept) => (
          <div key={dept.id} className="bg-blue-600 text-white px-4 py-3 rounded-lg text-center min-w-[200px]">
            <h3 className="font-semibold">{dept.name}</h3>
            {dept.manager && (
              <>
                <p className="text-sm opacity-90">{dept.manager.name || 'No Manager'}</p>
                <p className="text-xs opacity-75">{dept.manager.role}</p>
              </>
            )}
            <div className="mt-2 text-xs opacity-75">
              {dept.userDepartments.length} employees
            </div>
          </div>
        ))}
      </div>

      {/* Child Departments */}
      {childDepartments.length > 0 && (
        <>
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {childDepartments.map((dept) => (
              <div key={dept.id} className="bg-gray-600 text-white px-3 py-2 rounded text-center">
                <p className="font-medium">{dept.name}</p>
                {dept.manager && (
                  <p className="text-xs opacity-90">{dept.manager.name || 'No Manager'}</p>
                )}
                <div className="mt-1 text-xs opacity-75">
                  {dept.userDepartments.length} employees
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Department Details Component
function DepartmentDetails({ departments }: { departments: any[] }) {
  if (departments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No departments found. Add departments to see detailed information.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {departments.slice(0, 6).map((dept, index) => {
        const colors = [
          'blue', 'green', 'purple', 'orange', 'red', 'indigo'
        ];
        const color = colors[index % colors.length];
        
        return (
          <Card key={dept.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className={`h-5 w-5 text-${color}-600`} />
                {dept.name}
              </CardTitle>
              <CardDescription>
                {dept.description || 'Department team and roles'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-2 bg-${color}-50 rounded`}>
                  <span className="font-medium">Team Size</span>
                  <span className={`text-${color}-600 font-semibold`}>
                    {dept.userDepartments.length} members
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2 bg-green-50 rounded`}>
                  <span className="font-medium">Active Roles</span>
                  <span className="text-green-600 font-semibold">
                    {dept.departmentRoles.length} roles
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2 bg-purple-50 rounded`}>
                  <span className="font-medium">Manager</span>
                  <span className="text-purple-600 font-semibold">
                    {dept.manager?.name || 'Not assigned'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Skeleton Components
function OrganizationChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-48" />
        ))}
      </div>
      <div className="flex justify-center">
        <Skeleton className="w-px h-8" />
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

function DepartmentDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
