import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { folderPath = 'prismafiles/vculture' } = body;

    const apiKey = process.env.BUNNY_ACCESS_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'BunnyCDN not configured' },
        { status: 500 }
      );
    }

    // Inline access check
    const baseRoot = 'prismafiles/vculture';
    const normalizedPath = folderPath.replace(/^\/+/, '').replace(/\/+$/, '');
    
    let hasAccess = false;
    if (hasRole(user.role, 'ADMINISTRATOR')) {
      hasAccess = true;
    } else if (normalizedPath === baseRoot) {
      hasAccess = true; // allow root listing
    } else if (
      normalizedPath === `${baseRoot}/departments` ||
      normalizedPath.startsWith(`${baseRoot}/departments/`)
    ) {
      const parts = normalizedPath.split('/');
      const deptIndex = parts.indexOf('departments');
      const departmentName = parts[deptIndex + 1];
      if (!departmentName) {
        hasAccess = true; // listing departments root
      } else {
        const membership = await prisma.userDepartment.findFirst({
          where: {
            userId: user.id,
            leftAt: null,
            department: { name: departmentName }
          }
        });
        hasAccess = Boolean(membership);
      }
    } else if (
      normalizedPath === `${baseRoot}/users` ||
      normalizedPath.startsWith(`${baseRoot}/users/`)
    ) {
      const parts = normalizedPath.split('/');
      const usersIndex = parts.indexOf('users');
      const targetUserId = parts[usersIndex + 1];
      if (!targetUserId) {
        hasAccess = true; // listing users root
      } else {
        hasAccess = targetUserId === user.id; // own folder only
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // List folders from BunnyCDN
    const listUrl = `https://storage.bunnycdn.com/${storageZone}/${normalizedPath}/`;
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'AccessKey': apiKey,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Folder doesn't exist yet, return empty list
        return NextResponse.json({
          success: true,
          folders: [],
          files: [],
          currentPath: normalizedPath
        });
      }
      
      console.error('BunnyCDN API error:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: 'Failed to list folders' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Filter and organize the response
    const folders: any[] = [];
    const files: any[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        // Extract just the name from the ObjectName (which may be a full path)
        const objectName = item.ObjectName || '';
        const itemName = objectName.split('/').filter(Boolean).pop() || objectName;
        
        if (item.IsDirectory) {
          // For directories, ObjectName might be like "folderName/" or "path/to/folderName/"
          const folderName = itemName.replace(/\/$/, '');
          folders.push({
            name: folderName,
            path: `${normalizedPath}/${folderName}`,
            type: 'folder',
            size: '0 B',
            lastModified: item.LastChanged || new Date().toISOString()
          });
        } else {
          // For files, ObjectName is just the filename
          files.push({
            name: itemName,
            path: `${normalizedPath}/${itemName}`,
            type: 'file',
            size: formatBytes(item.Length || 0),
            lastModified: item.LastChanged || new Date().toISOString()
          });
        }
      });
    }

    // Sort folders and files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      folders,
      files,
      currentPath: normalizedPath,
      totalFolders: folders.length,
      totalFiles: files.length
    });

  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
