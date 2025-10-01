import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ContactsPageClient from './contacts-page-client'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-2">
              Manage your business contacts and their company relationships
            </p>
          </div>
        </div>
        
        <Suspense fallback={<ContactsPageSkeleton />}>
          <ContactsPageClient />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

function ContactsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
