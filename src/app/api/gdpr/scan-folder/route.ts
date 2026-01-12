import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { scanFolderRecursively } from '@/lib/gdpr-bulk-scanner';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only administrators and managers can scan folders
    if (!hasRole(user.role, 'ADMINISTRATOR') && !hasRole(user.role, 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { folderPath } = body;

    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // Check BunnyCDN configuration
    const apiKey = process.env.BUNNY_ACCESS_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'BunnyCDN API key not configured' },
        { status: 500 }
      );
    }

    // Start scanning (this will run asynchronously)
    // For now, we'll run it synchronously, but in production you might want to use a job queue
    const scanResult = await scanFolderRecursively(
      folderPath,
      storageZone,
      apiKey,
      (progress) => {
        // Progress callback - could be used for real-time updates via WebSocket or SSE
        console.log('Scan progress:', progress);
      }
    );

    return NextResponse.json({
      success: scanResult.success,
      message: scanResult.success 
        ? `Successfully scanned ${scanResult.scannedFiles} files. Found ${scanResult.filesWithPersonalData} files with personal data.`
        : 'Scan completed with errors',
      result: scanResult
    });

  } catch (error) {
    console.error('Error scanning folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
