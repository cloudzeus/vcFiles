import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { folderPath } = body;

    if (!folderPath || typeof folderPath !== 'string') {
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

    // Ensure the folder path ends with a slash for BunnyCDN
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const folderUrl = `https://storage.bunnycdn.com/${storageZone}/${normalizedPath}`;

    console.log(`Creating folder: ${normalizedPath}`);

    const response = await fetch(folderUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (response.ok || response.status === 409) {
      // 409 means folder already exists, which is fine
      console.log(`Successfully created/verified folder: ${normalizedPath}`);
      
      return NextResponse.json({
        success: true,
        message: 'Folder created successfully',
        folderPath: normalizedPath
      });
    } else {
      const errorText = await response.text();
      console.error(`Failed to create folder ${normalizedPath}:`, response.status, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create folder: ${errorText || response.statusText}` 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
