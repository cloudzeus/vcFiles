'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderIcon, FileIcon, RefreshCw, Search, HardDrive, Clock, Database } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
}

interface FolderStructure {
  path: string;
  items: FileItem[];
  lastUpdated: number;
}

export default function CDNBrowser() {
  const [currentPath, setCurrentPath] = useState('prismafiles/vculture');
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [redisStatus, setRedisStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, total: 0 });
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Test Redis connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/redis/test');
        const data = await response.json();
        
        if (data.success && data.connected) {
          setRedisStatus('connected');
        } else {
          setRedisStatus('error');
        }
      } catch (error) {
        console.error('Redis connection test failed:', error);
        setRedisStatus('error');
      }
    };
    
    testConnection();
  }, []);

  // Load folder contents with caching
  const loadFolderContents = useCallback(async (path: string) => {
    setLoading(true);
    
    try {
      // Try to get from cache first
      const cacheKey = `cdn:folder:${path}`;
      const response = await fetch(`/api/redis/cache?key=${encodeURIComponent(cacheKey)}`);
      const cachedData = response.ok ? await response.json() : null;
      
      if (cachedData && cachedData.success && cachedData.value && Date.now() - cachedData.value.lastUpdated < 300000) { // 5 minutes cache
        console.log('📖 Using cached folder data for:', path);
        setFolders(cachedData.value.items.filter((item: FileItem) => item.type === 'folder'));
        setFiles(cachedData.value.items.filter((item: FileItem) => item.type === 'file'));
        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1, total: prev.total + 1 }));
        setLoading(false);
        return;
      }

      // If not in cache or expired, fetch from API
      console.log('🌐 Fetching folder data for:', path);
      const folderResponse = await fetch(`/api/cdn/browse?path=${encodeURIComponent(path)}`);
      
      if (!folderResponse.ok) {
        throw new Error('Failed to fetch folder contents');
      }

      const data = await folderResponse.json();
      
      // Cache the new data
      const cacheResponse = await fetch('/api/redis/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: cacheKey,
          value: {
            path,
            items: data.items,
            lastUpdated: Date.now()
          },
          ttl: 300 // 5 minutes TTL
        }),
      });

      if (cacheResponse.ok) {
        console.log('💾 Cached folder data for:', path);
      }

      setFolders(data.items.filter((item: FileItem) => item.type === 'folder'));
      setFiles(data.items.filter((item: FileItem) => item.type === 'file'));
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1, total: prev.total + 1 }));
      
    } catch (error) {
      console.error('Error loading folder contents:', error);
      // Fallback to mock data if API fails
      const mockData = generateMockData(path);
      setFolders(mockData.filter(item => item.type === 'folder'));
      setFiles(mockData.filter(item => item.type === 'file'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate mock data for demonstration
  const generateMockData = (path: string): FileItem[] => {
    // Since vculture folder only contains the logo file, return empty for subfolders
    if (path !== 'prismafiles/vculture') {
      return [];
    }
    
    return [
      { 
        name: 'prismafiles.svg', 
        type: 'file' as const, 
        size: 25600, 
        modified: '2024-01-15', 
        path: `${path}/prismafiles.svg` 
      }
    ];
  };

  // Navigate to folder
  const navigateToFolder = useCallback((folderPath: string) => {
    setCurrentPath(folderPath);
    loadFolderContents(folderPath);
  }, [loadFolderContents]);

  // Navigate back
  const navigateBack = useCallback(() => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (parentPath === 'prismafiles') {
      setCurrentPath('prismafiles/vculture');
      loadFolderContents('prismafiles/vculture');
    } else if (parentPath === '') {
      setCurrentPath('prismafiles/vculture');
      loadFolderContents('prismafiles/vculture');
    } else {
      setCurrentPath(parentPath);
      loadFolderContents(parentPath);
    }
  }, [currentPath, loadFolderContents]);

  // Load initial data
  useEffect(() => {
    loadFolderContents(currentPath);
  }, [loadFolderContents]);

  // Filter items based on search
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setUploadMessage(null);
    
    try {
      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        const response = await fetch('/api/cdn/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        successCount++;
        console.log(`✅ Uploaded: ${file.name}`);
      }

      // Show success message
      setUploadMessage({
        type: 'success',
        text: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}!`
      });

      // Refresh the folder contents to show new files
      await loadFolderContents(currentPath);
      
      // Clear the file input
      event.target.value = '';
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadMessage(null), 5000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage({
        type: 'error',
        text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setUploadMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">CDN Browser</h1>
          <p className="text-gray-600 mb-4">Browse and manage your CDN files with intelligent caching</p>
          
          {/* Current Structure Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FolderIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-800">Current CDN Structure</span>
            </div>
            <p className="text-blue-700 text-sm">
              Root: <code className="bg-blue-100 px-2 py-1 rounded">prismafiles/vculture</code> 
              - This folder contains your application logo and any other files you upload.
            </p>
            <p className="text-blue-600 text-xs mt-2">
              💡 Tip: Use the upload feature to add files to this directory, or create subfolders as needed.
            </p>
          </div>
        </div>

        {/* Redis Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Redis Cache Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant={redisStatus === 'connected' ? 'default' : 'destructive'}
                className="flex items-center gap-2"
              >
                {redisStatus === 'connected' ? '✅ Connected' : 
                 redisStatus === 'connecting' ? '🔄 Connecting' : '❌ Error'}
              </Badge>
              <div className="text-sm text-gray-600">
                Cache Hits: {cacheStats.hits} | Misses: {cacheStats.misses} | 
                Hit Rate: {cacheStats.total > 0 ? Math.round((cacheStats.hits / cacheStats.total) * 100) : 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Current Path: {currentPath}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={navigateBack} 
                disabled={currentPath === 'prismafiles/vculture'}
                variant="outline"
              >
                ← Back
              </Button>
              <Button 
                onClick={() => loadFolderContents(currentPath)}
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                📁 Upload Files
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Hidden file input for upload */}
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Upload Message */}
        {uploadMessage && (
          <div className={`p-3 rounded-lg mb-4 ${uploadMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Folders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-blue-500" />
                Folders ({filteredFolders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No folders found</p>
                  <p className="text-sm text-gray-400">This directory is empty or contains only files</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.path}
                      onClick={() => navigateToFolder(folder.path)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                    >
                      <FolderIcon className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-800">{folder.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="w-5 h-5 text-green-500" />
                Files ({filteredFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No files found</p>
                  <p className="text-sm text-gray-400">This directory is empty or contains only folders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-800">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {file.size && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-4 h-4" />
                            {formatFileSize(file.size)}
                          </span>
                        )}
                        {file.modified && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {file.modified}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

