import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SharedItemView from '@/components/shared-item-view'

interface SharedItemPageProps {
  params: Promise<{ shareLink: string }>
}

export default async function SharedItemPage({ params }: SharedItemPageProps) {
  const { shareLink } = await params

  // Find the shared item by share link
  const sharedItem = await prisma.sharedItem.findFirst({
    where: {
      shareLink,
      sharingType: 'contact',
      isActive: true,
      OR: [
        { shareLinkExpiresAt: null },
        { shareLinkExpiresAt: { gt: new Date() } }
      ]
    },
    include: {
      sharedByUser: {
        select: { name: true, email: true }
      },
      sharedWithContact: {
        select: { name: true, email: true }
      }
    }
  })

  if (!sharedItem) {
    notFound()
  }

  // Check if the item itself has expired
  if (sharedItem.expiresAt && new Date(sharedItem.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Expired</h1>
          <p className="text-gray-600">
            This shared item has expired and is no longer accessible.
          </p>
        </div>
      </div>
    )
  }

  // Transform Date fields to strings for the component
  const transformedSharedItem = {
    ...sharedItem,
    sharedAt: sharedItem.sharedAt.toISOString(),
    expiresAt: sharedItem.expiresAt?.toISOString() || null,
    shareLinkExpiresAt: sharedItem.shareLinkExpiresAt?.toISOString() || null,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedItemView sharedItem={transformedSharedItem} />
    </div>
  )
}