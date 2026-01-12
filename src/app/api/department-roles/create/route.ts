import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
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
    const { name, description, departmentId, level } = body;

    // Validate required fields
    if (!name || !departmentId) {
      return NextResponse.json(
        { success: false, error: 'Name and department ID are required' },
        { status: 400 }
      );
    }

    // Check if role name already exists in this department
    const existingRole = await prisma.departmentRole.findFirst({
      where: {
        name,
        departmentId,
        isActive: true
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role with this name already exists in this department' },
        { status: 400 }
      );
    }

    // Create the new role
    const newRole = await prisma.departmentRole.create({
      data: {
        name,
        description: description || null,
        departmentId,
        level: level || 1,
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    });

    // Automatically create the role folder in BunnyCDN
    try {
      const apiKey = process.env.BUNNY_ACCESS_KEY;
      const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
      
      if (apiKey) {
        const folderPath = `prismafiles/vculture/departments/${newRole.department.name}/roles/${newRole.name}`;
        const folderUrl = `https://storage.bunnycdn.com/${storageZone}/${folderPath}/`;
        
        console.log(`Creating role folder: ${folderPath}/`);
        
        const folderResponse = await fetch(folderUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (folderResponse.ok || folderResponse.status === 409) {
          console.log(`Successfully created role folder: ${folderPath}/`);
          
          // Add a test file to confirm the folder structure
          const testFilePath = `${folderPath}/role-info.txt`;
          const testFileUrl = `https://storage.bunnycdn.com/${storageZone}/${testFilePath}`;
          
          await fetch(testFileUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': apiKey,
              'Content-Type': 'text/plain',
            },
            body: `Role: ${newRole.name}\nDepartment: ${newRole.department.name}\nLevel: ${newRole.level}\nDescription: ${newRole.description || 'No description'}\nCreated: ${new Date().toISOString()}`
          });
        } else {
          console.error(`Failed to create role folder: ${folderPath}`, folderResponse.status);
        }
      }
    } catch (error) {
      console.error('Error creating role folder in BunnyCDN:', error);
      // Don't fail the role creation if folder creation fails
    }

    return NextResponse.json({
      success: true,
      role: newRole,
    });

  } catch (error) {
    console.error('Error creating department role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
