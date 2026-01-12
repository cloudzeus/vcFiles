"use client"

import React, { useState, useEffect, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Folder, File, Search, Filter, Download, Share, Trash2, ChevronRight, 
  ChevronDown, Upload, Grid3X3, List, BarChart3, ArrowLeft, 
  FileText, Image, Video, Music, Archive, Code, FileImage, FileVideo, 
  FileAudio, FileArchive, FileCode, FileSpreadsheet, Presentation
} from 'lucide-react'
import ShareItemModal from './share-item-modal'
import { useRouter } from 'next/navigation'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { toast } from 'sonner'

interface FileItem {
  name: string
  path: string
  type: 'file'
  size: string
  lastModified: string
  hasAccess: boolean
  reason: string
  fileType?: string
}

interface FolderItem {
  name: string
  path: string
  type: 'folder'
  size?: string
  lastModified?: string
  hasAccess: boolean
  reason: string
}

type ItemType = FileItem | FolderItem

interface FilesBrowserProps {
  user: {
    id: string
    role: string
    name?: string | null
    email: string
    image?: string | null
  }
}

type ViewMode = 'grid' | 'list' | 'detailed'

export default function FilesBrowser({ user }: FilesBrowserProps) {
  const [items, setItems] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('prismafiles/vculture')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [subFolders, setSubFolders] = useState<Record<string, ItemType[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [pathHistory, setPathHistory] = useState<string[]>(['prismafiles/vculture'])
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: '0 B',
    fileTypes: {} as Record<string, number>
  })
  const router = useRouter()

  const baseRoot = 'prismafiles/vculture'

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  useEffect(() => {
    fetchCurrentFolderContents()
  }, [currentPath])

  const fetchCurrentFolderContents = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/cdn/list-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: currentPath })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Combine folders and files
        let allItems: ItemType[] = [
          ...data.folders.map((folder: any) => ({
            name: folder.name,
            path: folder.path,
            type: 'folder' as const,
            size: folder.size || '0 B',
            lastModified: folder.lastModified,
            hasAccess: true,
            reason: 'Access granted'
          })),
          ...data.files.map((file: any) => ({
            name: file.name,
            path: file.path,
            type: 'file' as const,
            size: file.size,
            lastModified: file.lastModified,
            hasAccess: true,
            reason: 'Access granted',
            fileType: getFileType(file.name)
          }))
        ]

        // Fallback: if at root and nothing returned from CDN, show base logical folders
        if (currentPath === baseRoot && allItems.length === 0) {
          allItems = [
            {
              name: 'departments',
              path: `${baseRoot}/departments`,
              type: 'folder',
              size: '0 B',
              lastModified: '',
              hasAccess: true,
              reason: 'Root folder'
            },
            {
              name: 'users',
              path: `${baseRoot}/users`,
              type: 'folder',
              size: '0 B',
              lastModified: '',
              hasAccess: true,
              reason: 'Root folder'
            }
          ]
        }

        // If we're in the users folder, try to get user names instead of IDs
        if (currentPath.includes('/users/') && currentPath !== `${baseRoot}/users`) {
          try {
            const userId = currentPath.split('/').pop()
            if (userId && userId !== 'users') {
              const userResponse = await fetch(`/api/users/${userId}`)
              if (userResponse.ok) {
                const userData = await userResponse.json()
                const userFolderIndex = allItems.findIndex(item => item.type === 'folder' && item.name === userId)
                if (userFolderIndex !== -1) {
                  allItems[userFolderIndex].name = userData.name || userData.email || userId
                }
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error)
          }
        }

        setItems(allItems)
        
        // Calculate stats
        calculateStats(allItems)
      }
    } catch (error) {
      console.error('Error fetching folder contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const folderPath = `${currentPath}/${newFolderName.trim()}`
      
      const response = await fetch('/api/cdn/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath })
      })

      const data = await response.json()

      if (data.success) {
        setNewFolderName('')
        setShowCreateFolderModal(false)
        await fetchCurrentFolderContents()
        toast.success('Folder created successfully')
      } else {
        toast.error(data.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const calculateStats = (items: ItemType[]) => {
    const fileTypes: Record<string, number> = {}
    let totalSize = 0
    let totalFiles = 0
    let totalFolders = 0

    items.forEach(item => {
      if (item.type === 'file') {
        totalFiles++
        const file = item as FileItem
        if (file.fileType) {
          fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1
        }
        // Parse size string to bytes for calculation
        totalSize += parseSizeToBytes(file.size)
      } else {
        totalFolders++
      }
    })

    setStats({
      totalFiles,
      totalFolders,
      totalSize: formatBytes(totalSize),
      fileTypes
    })
  }

  const parseSizeToBytes = (sizeStr: string): number => {
    const units: Record<string, number> = { 'B': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024, 'TB': 1024*1024*1024*1024 }
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/)
    if (match) {
      const [, value, unit] = match
      return parseFloat(value) * (units[unit.toUpperCase()] || 1)
    }
    return 0
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext) return 'Unknown'
    
    const typeMap: Record<string, string> = {
      // Documents
      'pdf': 'Document', 'doc': 'Document', 'docx': 'Document', 'txt': 'Document',
      'rtf': 'Document', 'odt': 'Document', 'pages': 'Document',
      
      // Spreadsheets
      'xls': 'Spreadsheet', 'xlsx': 'Spreadsheet', 'csv': 'Spreadsheet',
      'ods': 'Spreadsheet', 'numbers': 'Spreadsheet',
      
      // Presentations
      'ppt': 'Presentation', 'pptx': 'Presentation', 'key': 'Presentation',
      'odp': 'Presentation',
      
      // Images
      'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image',
      'bmp': 'Image', 'svg': 'Image', 'webp': 'Image', 'tiff': 'Image',
      
      // Videos
      'mp4': 'Video', 'avi': 'Video', 'mov': 'Video', 'wmv': 'Video',
      'flv': 'Video', 'webm': 'Video', 'mkv': 'Video',
      
      // Audio
      'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio', 'aac': 'Audio',
      'ogg': 'Audio', 'wma': 'Audio',
      
      // Archives
      'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive', 'tar': 'Archive',
      'gz': 'Archive', 'bz2': 'Archive',
      
      // Code
      'js': 'Code', 'ts': 'Code', 'jsx': 'Code', 'tsx': 'Code',
      'html': 'Code', 'css': 'Code', 'php': 'Code', 'py': 'Code',
      'java': 'Code', 'cpp': 'Code', 'c': 'Code', 'cs': 'Code'
    }
    
    return typeMap[ext] || 'Other'
  }

  const getFileIcon = (fileType: string) => {
    const iconMap: Record<string, any> = {
      'Document': FileText,
      'Spreadsheet': FileSpreadsheet,
      'Presentation': Presentation,
      'Image': FileImage,
      'Video': FileVideo,
      'Audio': FileAudio,
      'Archive': FileArchive,
      'Code': FileCode,
      'Other': File
    }
    return iconMap[fileType] || File
  }

  const navigateToFolder = (folderPath: string) => {
    setPathHistory(prev => [...prev, folderPath])
    setCurrentPath(folderPath)
    setExpandedFolders(new Set())
    setSubFolders({})
  }

  const navigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1)
      setPathHistory(newHistory)
      setCurrentPath(newHistory[newHistory.length - 1])
      setExpandedFolders(new Set())
      setSubFolders({})
    }
  }

  const canGoBack = pathHistory.length > 1

  const navigateToCrumb = (targetPath: string) => {
    setPathHistory(prev => {
      const index = prev.indexOf(targetPath)
      if (index !== -1) {
        return prev.slice(0, index + 1)
      }
      return [...prev, targetPath]
    })
    setCurrentPath(targetPath)
    setExpandedFolders(new Set())
    setSubFolders({})
  }

  const relativePath = currentPath.startsWith(baseRoot) ? currentPath.slice(baseRoot.length) : currentPath
  const relativeParts = relativePath.split('/').filter(Boolean)
  const breadcrumbs = [
    { name: 'vculture', path: baseRoot },
    ...relativeParts.map((segment, idx) => ({
      name: segment,
      path: [baseRoot, ...relativeParts.slice(0, idx + 1)].join('/')
    }))
  ]

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFileUpload = async (files: FileList | File[], relativePaths?: string[]) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      console.log('Starting upload to:', currentPath)
      console.log('Files to upload:', files)
      
      const formData = new FormData()
      const fileArray = Array.from(files)
      fileArray.forEach(file => {
        formData.append('files', file)
        console.log('Added file to FormData:', file.name, file.size)
      })
      formData.append('folderPath', currentPath)
      if (relativePaths && relativePaths.length === fileArray.length) {
        // Send relative paths to preserve folder structure
        formData.append('paths', JSON.stringify(relativePaths))
        console.log('Including relative paths for upload:', relativePaths)
      }
      
      console.log('Sending upload request...')
      const res = await fetch('/api/cdn/upload', {
        method: 'POST',
        body: formData
      })
      
      console.log('Upload response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Upload failed:', res.status, errorText)
        throw new Error(`Upload failed: ${res.status} ${errorText}`)
      }
      
      const result = await res.json()
      console.log('Upload successful:', result)
      
      setUploadProgress(100)
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 1000)
      
      await fetchCurrentFolderContents()
    } catch (err) {
      console.error('Upload error:', err)
      setIsUploading(false)
      setUploadProgress(0)
      alert(`Upload failed: ${err}`)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered')
    console.log('Event target:', event.target)
    console.log('Files:', event.target.files)
    console.log('Files length:', event.target.files?.length)
    
    const files = event.target.files
    if (files) {
      console.log('Calling handleFileUpload with files:', files)
      handleFileUpload(files)
    } else {
      console.log('No files selected')
    }
  }

  const handleFolderInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Folder input change event triggered')
    console.log('Event target:', event.target)
    console.log('Files:', event.target.files)
    console.log('Files length:', event.target.files?.length)
    
    const files = event.target.files
    if (files && files.length > 0) {
      console.log('Processing folder upload with files:', files)
      const relPaths = Array.from(files).map((f: any) => f.webkitRelativePath || f.name)
      console.log('Relative paths:', relPaths)
      handleFileUpload(files, relPaths)
    } else {
      console.log('No files selected for folder upload')
    }
  }

  const handleFileDelete = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    try {
      const res = await fetch('/api/cdn/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })
      if (!res.ok) throw new Error('Delete failed')
      await fetchCurrentFolderContents()
    } catch (err) {
      console.error('Delete error', err)
    }
  }

  const handleFileDownload = async (filePath: string) => {
    try {
      const res = await fetch('/api/cdn/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filePath.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <File className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Folder className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
                <p className="text-sm text-gray-600">Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSize}</p>
                <p className="text-sm text-gray-600">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Grid3X3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.fileTypes).length}</p>
                <p className="text-sm text-gray-600">File Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Type Breakdown */}
      {Object.keys(stats.fileTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>File Types</CardTitle>
            <CardDescription>Breakdown of files by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.fileTypes).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="flex items-center gap-2">
                  {React.createElement(getFileIcon(type), { className: 'h-3 w-3' })}
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {canGoBack && (
            <Button variant="outline" onClick={navigateBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Breadcrumb>
            <BreadcrumbList className="max-w-full overflow-x-auto whitespace-nowrap">
              {breadcrumbs.map((crumb, idx) => (
                <Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    {idx === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="truncate max-w-[30ch]">{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); navigateToCrumb(crumb.path) }} className="truncate max-w-[30ch] inline-block align-bottom">{crumb.name}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {idx !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-blue-50' : ''}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-blue-50' : ''}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('detailed')} className={viewMode === 'detailed' ? 'bg-blue-50' : ''}>
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowCreateFolderModal(true)}>
            <Folder className="h-4 w-4" />
            New Folder
          </Button>
          {/* Hidden input for folder upload */}
          <input
            type="file"
            className="hidden"
            id="folder-upload"
            // @ts-ignore - webkitdirectory is non-standard but supported by Chromium-based browsers
            webkitdirectory=""
            // @ts-ignore
            directory=""
            onChange={handleFolderInputChange}
          />
          <div className="flex gap-2">
            <label htmlFor="folder-upload">
              <Button variant="outline" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Upload Folder
              </Button>
            </label>
            
            {/* Backup folder upload button */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                console.log('Backup folder upload button clicked')
                const folderInput = document.getElementById('folder-upload') as HTMLInputElement
                if (folderInput) {
                  folderInput.click()
                  console.log('Folder input clicked programmatically')
                } else {
                  console.error('Folder input not found')
                }
              }}
            >
              <Folder className="h-4 w-4" />
              Browse Folder
            </Button>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No items found in this folder</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery ? 'Try adjusting your search terms.' : 'This folder is empty.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredItems.map((item) => (
              <Card key={item.path} className="hover:shadow-md transition-shadow">
                <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-3'}>
                  <div className={viewMode === 'grid' ? 'text-center' : 'flex items-center justify-between'}>
                    <div className={viewMode === 'grid' ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3 min-w-0'}>
                      {item.type === 'folder' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToFolder(item.path)}
                          className={viewMode === 'grid' ? 'w-full justify-center' : 'p-1 h-8 w-8'}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Folder className="h-5 w-5 text-blue-600" />
                          </div>
                          {viewMode === 'grid' && (
                            <span className="ml-2">Open</span>
                          )}
                        </Button>
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          {React.createElement(getFileIcon((item as FileItem).fileType || 'Other'), { className: 'h-5 w-5 text-green-600' })}
                        </div>
                      )}
                      
                      {viewMode === 'grid' && (
                        <div className="flex justify-center mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 h-6 w-6" 
                            onClick={() => {
                              setSelectedItem(item)
                              setShowShareModal(true)
                            }}
                            title="Share"
                          >
                            <Share className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className={viewMode === 'grid' ? 'text-center' : 'min-w-0'}>
                        <h4 className={`font-medium ${viewMode === 'grid' ? 'text-sm' : 'text-base'} truncate`}>
                          {item.name}
                        </h4>
                        <p className={`text-sm text-gray-600 ${viewMode === 'grid' ? 'text-xs' : ''}`}>
                          {item.type === 'folder' ? 'Folder' : `${(item as FileItem).size} • ${(item as FileItem).fileType}`}
                        </p>
                        {viewMode === 'detailed' && (
                          <p className="text-xs text-gray-500">
                            Modified: {item.lastModified ? new Date(item.lastModified).toLocaleDateString() : 'Unknown'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {viewMode !== 'grid' && (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 h-6 w-6" 
                          onClick={() => {
                            setSelectedItem(item)
                            setShowShareModal(true)
                          }}
                          title="Share"
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                        {item.type === 'file' && (
                          <>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => handleFileDownload(item.path)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" onClick={() => handleFileDelete(item.path)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-dashed border-2 overflow-hidden transition-colors ${
          isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {isUploading ? 'Uploading files...' : 'Drag and drop files here or click to browse'}
          </p>
          
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              accept="*/*"
            />
            <div className="flex gap-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button className="cursor-pointer" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </Button>
              </label>
              
              {/* Backup button that directly triggers file input */}
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Backup upload button clicked')
                  document.getElementById('file-upload')?.click()
                }}
                disabled={isUploading}
              >
                Browse Files
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">
              Supported: Documents, Images, Videos, Audio, Archives, Code files
            </p>
            
            {/* Debug info */}
            <div className="text-xs text-gray-400 mt-2">
              Current path: {currentPath}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateFolderModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Item Modal */}
      {showShareModal && selectedItem && (
        <ShareItemModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          item={{
            name: selectedItem.name,
            path: selectedItem.path,
            type: selectedItem.type
          }}
          currentUser={{
            id: user.id,
            name: user.name || null,
            email: user.email
          }}
        />
      )}
    </div>
  )
}
