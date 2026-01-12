import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    const apiKey = process.env.BUNNY_ACCESS_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'BunnyCDN API key not configured' },
        { status: 500 }
      );
    }

    // Test different paths to understand the structure
    const testPaths = [
      '', // Root of storage zone
      'prismafiles',
      'vculture',
      'prismafiles/vculture',
      'prismafiles/vculture/prismafiles.svg'
    ];

    const results = [];

    for (const testPath of testPaths) {
      try {
        const apiUrl = `https://storage.bunnycdn.com/${storageZone}/${testPath}`;
        console.log(`Testing path: ${testPath}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'AccessKey': apiKey,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            path: testPath,
            status: response.status,
            success: true,
            itemCount: Array.isArray(data) ? data.length : 'Single file',
            isDirectory: Array.isArray(data),
            url: apiUrl
          });
        } else {
          results.push({
            path: testPath,
            status: response.status,
            success: false,
            error: response.statusText,
            url: apiUrl
          });
        }
      } catch (error) {
        results.push({
          path: testPath,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `https://storage.bunnycdn.com/${storageZone}/${testPath}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      storageZone,
      apiKeyConfigured: !!apiKey,
      testResults: results,
      environment: {
        BUNNY_ACCESS_KEY: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set',
        BUNNY_STORAGE_ZONE: storageZone,
        BUNNY_STORAGE_URL: process.env.BUNNY_STORAGE_URL || 'Not set'
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug endpoint failed' },
      { status: 500 }
    );
  }
}
