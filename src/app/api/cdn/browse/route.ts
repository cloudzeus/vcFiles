import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'prismafiles/vculture';
    
    console.log('🌐 CDN Browse API called for path:', path);
    
    // BunnyCDN Storage API endpoint
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
    const baseUrl = process.env.BUNNY_STORAGE_URL || 'https://kolleris.b-cdn.net';
    const apiKey = process.env.BUNNY_ACCESS_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'BunnyCDN API key not configured' },
        { status: 500 }
      );
    }

    // Construct the full API URL - BunnyCDN Storage API expects the full path
    // Ensure path ends with / for directory listing
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    const apiUrl = `https://storage.bunnycdn.com/${storageZone}/${normalizedPath}`;
    
    console.log('BunnyCDN API Request:', {
      storageZone,
      path: normalizedPath,
      apiUrl
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'AccessKey': apiKey,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Folder doesn't exist yet, return empty list
        console.log('Folder not found, returning empty list:', normalizedPath);
        return NextResponse.json({
          success: true,
          data: [],
          items: [],
          currentPath: path,
          totalItems: 0
        });
      }
      
      const errorText = await response.text();
      console.error('BunnyCDN API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch CDN contents: ${errorText || response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data: any[] = await response.json();
    
    // Transform the data to match expected format
    const transformedData = (Array.isArray(data) ? data : []).map((item: any) => ({
      ObjectName: item.ObjectName || item.name || '',
      Length: item.Length || item.size || 0,
      LastChanged: item.LastChanged || item.lastModified || new Date().toISOString(),
      IsDirectory: item.IsDirectory !== undefined ? item.IsDirectory : (item.type === 'folder' || item.type === 'directory'),
      ServerId: item.ServerId || 0,
      ArrayNumber: item.ArrayNumber || 0,
      P2PHash: item.P2PHash || '',
      Replication: item.Replication || 0,
      StreamCount: item.StreamCount || 0,
      MetaData: item.MetaData || {},
      fullUrl: `${baseUrl}/${storageZone}/${item.ObjectName || item.name || ''}`,
      displayName: (item.ObjectName || item.name || '').split('/').pop() || (item.ObjectName || item.name || ''),
      size: item.IsDirectory ? null : formatFileSize(item.Length || item.size || 0),
      lastModified: new Date(item.LastChanged || item.lastModified || new Date()).toLocaleDateString(),
      isDirectory: item.IsDirectory !== undefined ? item.IsDirectory : (item.type === 'folder' || item.type === 'directory'),
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      items: transformedData,
      currentPath: path,
      totalItems: transformedData.length
    });
    
  } catch (error) {
    console.error('❌ CDN Browse API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to browse CDN files' 
      },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
