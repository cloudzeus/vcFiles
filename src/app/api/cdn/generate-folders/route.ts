import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!hasRole(user.role, 'ADMINISTRATOR')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only administrators can generate folders.' },
        { status: 403 }
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

    console.log('BunnyCDN Configuration:', {
      storageZone,
      apiKeyLength: apiKey ? apiKey.length : 0,
      hasApiKey: !!apiKey
    });

    // Test BunnyCDN connection first
    try {
      const testUrl = `https://storage.bunnycdn.com/${storageZone}/`;
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'AccessKey': apiKey,
          'Accept': 'application/json',
        },
      });
      
      console.log('BunnyCDN Connection Test:', {
        status: testResponse.status,
        ok: testResponse.ok,
        url: testUrl
      });
      
      if (!testResponse.ok && testResponse.status !== 404) {
        return NextResponse.json(
          { success: false, error: `BunnyCDN connection failed: ${testResponse.status} ${testResponse.statusText}` },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('BunnyCDN connection test failed:', error);
      return NextResponse.json(
        { success: false, error: 'BunnyCDN connection test failed' },
        { status: 500 }
      );
    }

    // Get all departments and users
    const [departments, users] = await Promise.all([
      prisma.department.findMany(),
      prisma.user.findMany()
    ]);

    if (departments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No departments found. Please create departments first.' },
        { status: 400 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found.' },
        { status: 400 }
      );
    }

    const results = {
      departments: [] as any[],
      users: [] as any[],
      errors: [] as string[]
    };

    // Helper function to create folder structure in BunnyCDN
    const createBunnyFolder = async (folderPath: string): Promise<boolean> => {
      try {
        // Create folders inside prismafiles/vculture
        const fullPath = `prismafiles/vculture/${folderPath}`;
        
        // First, try to create the folder by PUTting to the folder path with trailing slash
        const folderUrl = `https://storage.bunnycdn.com/${storageZone}/${fullPath}/`;
        
        console.log(`Creating folder: ${fullPath}/`);
        
        const folderResponse = await fetch(folderUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (folderResponse.ok || folderResponse.status === 409) { // 409 means already exists
          console.log(`Successfully created/verified folder: ${fullPath}/`);
          
          // Now add a test file to confirm the folder structure
          const testFilePath = `${fullPath}/test.txt`;
          const testFileUrl = `https://storage.bunnycdn.com/${storageZone}/${testFilePath}`;
          
          const fileResponse = await fetch(testFileUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': apiKey,
              'Content-Type': 'text/plain',
            },
            body: `Folder structure confirmed at ${new Date().toISOString()}`
          });

          if (fileResponse.ok) {
            console.log(`Successfully added test file to: ${fullPath}/`);
            return true;
          } else {
            console.error(`Failed to add test file to ${fullPath}:`, fileResponse.status);
            return false;
          }
        } else {
          const errorText = await folderResponse.text();
          console.error(`Failed to create folder ${fullPath}:`, folderResponse.status, errorText);
          return false;
        }
      } catch (error) {
        console.error(`Error creating folder ${folderPath}:`, error);
        return false;
      }
    };

    // Create root folders in BunnyCDN first
    const rootFolders = ['departments', 'users'];
    for (const rootFolder of rootFolders) {
      const success = await createBunnyFolder(rootFolder);
      if (!success) {
        results.errors.push(`Failed to create root folder: ${rootFolder}`);
      }
    }

    // Wait a moment for root folders to be established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate department folders in BunnyCDN
    for (const department of departments) {
      try {
        const folderPath = `departments/${department.name}`;
        const success = await createBunnyFolder(folderPath);
        
        if (success) {
          results.departments.push({
            name: department.name,
            path: folderPath,
            status: 'created'
          });
        } else {
          results.departments.push({
            name: department.name,
            path: folderPath,
            status: 'failed'
          });
          results.errors.push(`Failed to create department folder: ${department.name}`);
        }
        
        // Small delay between folder creations
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.errors.push(`Error creating department folder ${department.name}: ${error}`);
      }
    }

    // Generate user folders in BunnyCDN
    for (const user of users) {
      try {
        const folderPath = `users/${user.id}`;
        const success = await createBunnyFolder(folderPath);
        
        if (success) {
          results.users.push({
            id: user.id,
            name: user.name || user.email,
            path: folderPath,
            status: 'created'
          });
        } else {
          results.users.push({
            id: user.id,
            name: user.name || user.email,
            path: folderPath,
            status: 'failed'
          });
          results.errors.push(`Failed to create user folder: ${user.name || user.email}`);
        }
        
        // Small delay between folder creations
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.errors.push(`Error creating user folder ${user.name || user.email}: ${error}`);
      }
    }

    const success = results.errors.length === 0;
    const hasAnySuccess = results.departments.some(d => d.status === 'created') || results.users.some(u => u.status === 'created');
    
    // Determine the appropriate status code
    let status = 200;
    if (!success && hasAnySuccess) {
      status = 207; // Partial success - some folders created, some failed
    } else if (!success && !hasAnySuccess) {
      status = 500; // Complete failure
    }

    return NextResponse.json({
      success,
      message: success 
        ? 'All folders created successfully in BunnyCDN' 
        : hasAnySuccess 
          ? 'Some folders created successfully, some failed'
          : 'Failed to create any folders',
      results,
      summary: {
        totalDepartments: departments.length,
        totalUsers: users.length,
        createdDepartments: results.departments.filter(d => d.status === 'created').length,
        createdUsers: results.users.filter(u => u.status === 'created').length,
        failedDepartments: results.departments.filter(d => d.status === 'failed').length,
        failedUsers: results.users.filter(u => u.status === 'failed').length,
        errors: results.errors.length
      }
    }, { status });

  } catch (error) {
    console.error('Error generating folders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
