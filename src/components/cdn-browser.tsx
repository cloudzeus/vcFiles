'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  File, 
  ArrowLeft, 
  Home, 
  Download, 
  Eye, 
  Grid3X3, 
  List,
  Search,
  RefreshCw,
  Upload,
  Trash2,
  MoreVertical,
  Copy,
  ExternalLink,
  Play,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import FileUpload from './file-upload';

interface CDNFile {
  ObjectName: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
  ServerId: number;
  ArrayNumber: number;
  P2PHash: string;
  Replication: number;
  StreamCount: number;
  MetaData: Record<string, string>;
  fullUrl: string;
  displayName: string;
  size: string | null;
  lastModified: string;
  isDirectory: boolean;
}

interface CDNResponse {
  success: boolean;
  data?: CDNFile[];
  error?: string;
  currentPath: string;
  baseUrl: string;
}

export default function CDNBrowser() {
  const [files, setFiles] = useState<CDNFile[]>([]);
  const [currentPath, setCurrentPath] = useState('prismafiles/vculture');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'quick'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  // Cache for storing folder contents
  const [folderCache, setFolderCache] = useState<Record<string, { data: CDNFile[], timestamp: number }>>({});
  const [lastSuccessfulPath, setLastSuccessfulPath] = useState<string>('prismafiles/vculture');

  // Preload adjacent folders for better performance
  const preloadAdjacentFolders = useCallback(async (currentPath: string) => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');
    
    // Preload parent folder if not cached
    if (parentPath && !folderCache[parentPath]) {
      console.log('Preloading parent folder:', parentPath);
      try {
        const response = await fetch(`/api/cdn?path=${encodeURIComponent(parentPath)}`);
        const data = await response.json();
        if (data.success && data.data) {
          setFolderCache(prev => ({
            ...prev,
            [parentPath]: {
              data: data.data,
              timestamp: Date.now()
            }
          }));
        }
      } catch (error) {
        console.log('Failed to preload parent folder:', error);
      }
    }
  }, [folderCache]);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    
    // Check cache first
    const cacheKey = path || 'prismafiles/vculture';
    const cachedData = folderCache[cacheKey];
    const cacheAge = Date.now() - (cachedData?.timestamp || 0);
    const cacheValid = cachedData && cacheAge < 5 * 60 * 1000; // 5 minutes
    
    if (cacheValid) {
      console.log('Using cached data for:', path);
      setFiles(cachedData.data);
      setCurrentPath(path);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/cdn?path=${encodeURIComponent(path)}`);
      const data: CDNResponse = await response.json();
      
      if (data.success && data.data) {
        setFiles(data.data);
        setCurrentPath(data.currentPath);
        setLastSuccessfulPath(path);
        
        // Cache the successful result
        if (data.data && data.data.length > 0) {
          const cacheData: CDNFile[] = data.data;
          setFolderCache(prev => ({
            ...prev,
            [cacheKey]: {
              data: cacheData,
              timestamp: Date.now()
            }
          }));
        }
        
        console.log('Successfully fetched and cached data for:', path);
      } else {
        // If we have cached data for this path, show it with a warning
        if (cachedData) {
          console.log('Using stale cached data due to API error:', path);
          setFiles(cachedData.data);
          setCurrentPath(path);
          setError(`Using cached data: ${data.error}`);
        } else {
          setError(data.error || 'Failed to fetch files');
        }
      }
    } catch (err) {
      // If we have cached data, show it with a warning
      if (cachedData) {
        console.log('Using cached data due to network error:', path);
        setFiles(cachedData.data);
        setCurrentPath(path);
        setError('Network error occurred - showing cached data');
      } else {
        setError('Network error occurred');
        console.error('Error fetching files:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [folderCache]);

  useEffect(() => {
    fetchFiles(currentPath);
    // Preload adjacent folders for better performance
    preloadAdjacentFolders(currentPath);
  }, [fetchFiles, currentPath, preloadAdjacentFolders]);

  const navigateToFolder = (folderPath: string) => {
    // Check if we have cached data for this folder
    const cachedData = folderCache[folderPath];
    if (cachedData) {
      console.log('Navigating to cached folder:', folderPath);
      setFiles(cachedData.data);
      setCurrentPath(folderPath);
      setSelectedFiles(new Set());
      setError(null);
    } else {
      // Fetch the folder contents
      setCurrentPath(folderPath);
      setSelectedFiles(new Set());
      fetchFiles(folderPath);
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/');
    
    // Prevent navigation above the root folder
    if (newPath === 'prismafiles') {
      setCurrentPath('prismafiles/vculture');
    } else if (newPath === '') {
      setCurrentPath('prismafiles/vculture');
    } else {
      setCurrentPath(newPath);
    }
    setSelectedFiles(new Set());
  };

  const navigateHome = () => {
    setCurrentPath('prismafiles/vculture');
    setSelectedFiles(new Set());
  };

  const filteredFiles = files.filter(file => 
    file.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileClick = (file: CDNFile) => {
    if (file.isDirectory) {
      // Validate that the folder path is accessible before navigating
      const folderPath = file.ObjectName;
      console.log('Attempting to navigate to folder:', folderPath);
      
      // Check if we have cached data for this folder
      if (folderCache[folderPath]) {
        navigateToFolder(folderPath);
      } else {
        // Try to fetch the folder contents first
        setLoading(true);
        fetchFiles(folderPath);
      }
    } else {
      // Handle file actions (preview, download, etc.)
      window.open(file.fullUrl, '_blank');
    }
  };

  const handleFileSelect = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (selectedFiles.size === 0) {
      toast.error('No files selected');
      return;
    }
    
    // Implement bulk actions here
    toast.info(`${action} for ${selectedFiles.size} files`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      toast.info(`Dropped ${droppedFiles.length} files`);
      // Implement file upload logic here
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return Folder;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return Image;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
        return Video;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return Music;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return FileText;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
        return Archive;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return Code;
      default:
        return File;
    }
  };

  const getFileTypeColor = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return 'text-blue-500';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'text-green-500';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
        return 'text-purple-500';
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return 'text-pink-500';
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return 'text-blue-600';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
        return 'text-orange-500';
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <File className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Files</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            
            {/* Debug Information */}
            <div className="bg-gray-50 p-3 rounded-lg text-left text-xs">
              <p className="font-medium mb-2">Debug Info:</p>
              <p><strong>Current Path:</strong> {currentPath}</p>
              <p><strong>Storage Zone:</strong> kolleris</p>
              <p><strong>Full Path:</strong> kolleris/{currentPath}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => fetchFiles(currentPath)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.open('/api/cdn/debug', '_blank')} 
              variant="outline"
              size="sm"
            >
              Debug API
            </Button>
            <Button 
              onClick={() => setCurrentPath('')} 
              variant="outline"
              size="sm"
            >
              Go to Root
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                          <CardTitle className="flex items-center space-x-2">
              <Folder className="h-5 w-5" />
              <span>CDN Browser</span>
              <Badge variant="secondary">
                {currentPath === '' ? 'Root' : currentPath}
              </Badge>
              <Badge variant="outline" className="text-xs">
                CDN Browser
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(folderCache).length} cached
              </Badge>
            </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFiles(currentPath)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFolderCache({});
                  toast.success('Cache cleared');
                }}
                title="Clear cache"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Access Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>
              <strong>CDN Browser:</strong> Browse and manage files in your BunnyCDN storage zone.
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <strong>Storage Zone:</strong> kolleris | <strong>Base URL:</strong> https://kolleris.b-cdn.net
          </div>
        </CardContent>
      </Card>

      {/* Navigation Breadcrumb */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateHome}
              className="h-8 px-2"
            >
              <Home className="h-4 w-4" />
            </Button>
            <span>/</span>
            {currentPath !== '' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateUp}
                  className="h-8 px-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span>/</span>
              </>
            )}
            <span className="font-medium">
              {currentPath === '' ? 'Root' : currentPath}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Folder Statistics */}
      {!loading && files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {files.filter(f => f.isDirectory).length}
                </div>
                <div className="text-sm text-gray-600">Folders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {files.filter(f => !f.isDirectory).length}
                </div>
                <div className="text-sm text-gray-600">Files</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {files.filter(f => !f.isDirectory).reduce((acc, f) => acc + (f.Length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Size (bytes)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {searchQuery ? filteredFiles.length : files.length}
                </div>
                <div className="text-sm text-gray-600">
                  {searchQuery ? 'Filtered' : 'Total'} Items
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'quick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('quick')}
                title="Quick Actions View"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFiles.size} file(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Download')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Grid/List */}
      <div
        className={`min-h-[400px] ${
          dragOver ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'This folder is empty'}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'quick' ? (
          // Quick Actions View - Compact with action buttons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.displayName, file.isDirectory);
              const iconColor = getFileTypeColor(file.displayName, file.isDirectory);
              
              return (
                <Card
                  key={file.ObjectName}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    selectedFiles.has(file.ObjectName) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-3">
                      {/* File Icon */}
                      <div className="flex justify-center">
                        <FileIcon className={`h-12 w-12 ${iconColor}`} />
                      </div>
                      
                      {/* File Name */}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate" title={file.displayName}>
                          {file.displayName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.isDirectory ? 'Folder' : file.size || 'Unknown size'}
                        </p>
                      </div>
                      
                      {/* Quick Action Buttons */}
                      <div className="flex items-center justify-center space-x-2 pt-2">
                        {file.isDirectory ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToFolder(file.ObjectName);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.fullUrl, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(file.fullUrl);
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy URL
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Trigger download
                                const link = document.createElement('a');
                                link.href = file.fullUrl;
                                link.download = file.displayName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Selection Checkbox */}
                      <div className="flex justify-center pt-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.ObjectName)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file.ObjectName, e.target.checked);
                          }}
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredFiles.map((file) => (
              <Card
                key={file.ObjectName}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFiles.has(file.ObjectName) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {file.isDirectory ? (
                          <Folder className="h-10 w-10 text-blue-500" />
                        ) : (
                          <File className="h-10 w-10 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate" title={file.displayName}>
                          {file.displayName}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          {file.size && <span>{file.size}</span>}
                          {file.size && file.lastModified && <span>•</span>}
                          <span>{file.lastModified}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.ObjectName)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleFileSelect(file.ObjectName, e.target.checked);
                        }}
                        className="rounded border-gray-300"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(file.fullUrl);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          {!file.isDirectory && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.fullUrl, '_blank');
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(file.ObjectName);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Path
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div className="fixed inset-0 bg-blue-500/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-semibold mb-2">Drop files to upload</h3>
            <p className="text-gray-600">Release to upload files to this folder</p>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showUpload && (
        <FileUpload
          currentPath={currentPath}
          onUploadComplete={() => {
            fetchFiles(currentPath);
            setShowUpload(false);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
