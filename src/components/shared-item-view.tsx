"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Folder, File, Download, Calendar, User, Mail, 
  FileText, Image, Video, Music, Archive, Code, FileImage, 
  FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, 
  Presentation, ExternalLink, Clock, Eye
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

interface SharedItemViewProps {
  sharedItem: SharedItem
}

export default function SharedItemView({ sharedItem }: SharedItemViewProps) {
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-green-500" />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-8 w-8 text-purple-500" />
      case 'mp3':
      case 'wav':
        return <Music className="h-8 w-8 text-orange-500" />
      case 'zip':
      case 'rar':
        return <Archive className="h-8 w-8 text-yellow-500" />
      case 'js':
      case 'ts':
      case 'py':
        return <Code className="h-8 w-8 text-gray-500" />
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-8 w-8 text-orange-600" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/cdn/download?path=${encodeURIComponent(sharedItem.itemPath)}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = sharedItem.itemName
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
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {getFileIcon(sharedItem.itemName)}
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {sharedItem.itemName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {sharedItem.description || 'No description provided'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {sharedItem.itemType}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">File Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Path:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {sharedItem.itemPath}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Shared on:</span>
                  <span className="text-sm">
                    {format(new Date(sharedItem.sharedAt), 'PPP')}
                  </span>
                </div>
                {sharedItem.expiresAt && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Expires:</span>
                    <span className="text-sm">
                      {format(new Date(sharedItem.expiresAt), 'PPP')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Sharing Details</h3>
              <div className="space-y-3">
                {sharedItem.sharedByUser && (
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Shared by:</span>
                    <span className="text-sm">
                      {sharedItem.sharedByUser.name || sharedItem.sharedByUser.email}
                    </span>
                  </div>
                )}
                {sharedItem.sharedWithContact && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Shared with:</span>
                    <span className="text-sm">
                      {sharedItem.sharedWithContact.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="text-xs">
                    {sharedItem.sharingType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {sharedItem.canView && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Badge>
              )}
              {sharedItem.canDownload && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Badge>
              )}
              {sharedItem.canEdit && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <FileText className="h-3 w-3 mr-1" />
                  Edit
                </Badge>
              )}
              {sharedItem.canDelete && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <File className="h-3 w-3 mr-1" />
                  Delete
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {sharedItem.canDownload && (
              <Button 
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download File'}
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}