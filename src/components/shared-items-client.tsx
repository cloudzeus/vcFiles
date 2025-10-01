"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Folder, File, Download, Share, Calendar, User, Mail, 
  FileText, Image, Video, Music, Archive, Code, FileImage, 
  FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, 
  Presentation, ExternalLink, Link
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface SharedItem {
  id: string
  itemPath: string
  itemName: string
  itemType: string
  sharedAt: string
  expiresAt: string | null
  shareLinkExpiresAt: string | null
  sharingType: string
  canView: boolean
  canDownload: boolean
  canEdit: boolean
  canDelete: boolean
  description: string | null
  shareLink: string | null
  sharedByUser?: {
    name: string | null
    email: string
  }
  sharedWithContact?: {
    name: string
    email: string | null
  } | null
}

interface SharedItemsClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

export default function SharedItemsClient({ user }: SharedItemsClientProps) {
  const [sharedByMe, setSharedByMe] = useState<SharedItem[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'shared-with-me' | 'shared-by-me'>('shared-with-me')
  const { toast } = useToast()

  const fileTypeIcons = {
    'pdf': FileText,
    'doc': FileText,
    'docx': FileText,
    'txt': FileText,
    'jpg': Image,
    'jpeg': Image,
    'png': Image,
    'gif': Image,
    'mp4': Video,
    'avi': Video,
    'mov': Video,
    'mp3': Music,
    'wav': Music,
    'zip': Archive,
    'rar': Archive,
    'js': Code,
    'ts': Code,
    'py': Code,
    'xlsx': FileSpreadsheet,
    'csv': FileSpreadsheet,
    'ppt': Presentation,
    'pptx': Presentation,
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const IconComponent = fileTypeIcons[extension as keyof typeof fileTypeIcons] || File
    return <IconComponent className="h-5 w-5" />
  }

  const fetchSharedItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sharing')
      if (response.ok) {
        const data = await response.json()
        setSharedWithMe(data.sharedWithMe || [])
        setSharedByMe(data.sharedByMe || [])
      }
    } catch (error) {
      console.error('Error fetching shared items:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch shared items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (itemPath: string, itemName: string) => {
    try {
      const response = await fetch(`/api/cdn/download?path=${encodeURIComponent(itemPath)}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = itemName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchSharedItems()
  }, [])

  const renderSharedItem = (item: SharedItem) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {getFileIcon(item.itemName)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.itemName}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {item.description || 'No description'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-400">
                  {format(new Date(item.sharedAt), 'MMM d, yyyy')}
                </span>
                {item.sharedByUser && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      by {item.sharedByUser.name || item.sharedByUser.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {item.canDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(item.itemPath, item.itemName)}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {item.shareLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/shared/${item.shareLink}`)
                  toast({
                    title: 'Success',
                    description: 'Share link copied to clipboard',
                  })
                }}
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'shared-with-me' | 'shared-by-me')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shared-with-me">Shared with Me</TabsTrigger>
          <TabsTrigger value="shared-by-me">Shared by Me</TabsTrigger>
        </TabsList>

        <TabsContent value="shared-with-me" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Files Shared with You</CardTitle>
              <CardDescription>
                Files and folders that have been shared with you by other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading shared items...</p>
                </div>
              ) : sharedWithMe.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No files have been shared with you yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedWithMe.map(renderSharedItem)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared-by-me" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Files You've Shared</CardTitle>
              <CardDescription>
                Files and folders that you have shared with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading shared items...</p>
                </div>
              ) : sharedByMe.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Share className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>You haven't shared any files yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedByMe.map(renderSharedItem)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}