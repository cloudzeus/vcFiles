import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

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

    // Get all departments
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      departments,
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { name, description, email, managerId, parentId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    // Check if department name already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { name: name.trim() }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'A department with this name already exists' },
        { status: 409 }
      );
    }

    // Validate manager if provided
    if (managerId && managerId.trim() !== '') {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });
      if (!manager) {
        return NextResponse.json(
          { success: false, error: 'Invalid manager ID' },
          { status: 400 }
        );
      }
    }

    // Validate parent department if provided
    if (parentId && parentId.trim() !== '') {
      const parentDepartment = await prisma.department.findUnique({
        where: { id: parentId }
      });
      if (!parentDepartment) {
        return NextResponse.json(
          { success: false, error: 'Invalid parent department ID' },
          { status: 400 }
        );
      }
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        email: email?.trim() || null,
        managerId: managerId?.trim() || null,
        parentId: parentId?.trim() || null,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
          }
        },
        userDepartments: {
          select: {
            id: true,
            userId: true,
            departmentId: true,
            jobPosition: true,
            isManager: true,
            joinedAt: true,
            leftAt: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        departmentRoles: {
          select: {
            id: true,
            name: true,
            description: true,
            departmentId: true,
            level: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    // Automatically create the department folder in BunnyCDN
    try {
      const apiKey = process.env.BUNNY_ACCESS_KEY;
      const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
      
      if (apiKey) {
        const folderPath = `prismafiles/vculture/departments/${department.name}`;
        const folderUrl = `https://storage.bunnycdn.com/${storageZone}/${folderPath}/`;
        
        console.log(`Creating department folder: ${folderPath}/`);
        
        const folderResponse = await fetch(folderUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (folderResponse.ok || folderResponse.status === 409) {
          console.log(`Successfully created department folder: ${folderPath}/`);
          
          // Add a test file to confirm the folder structure
          const testFilePath = `${folderPath}/department-info.txt`;
          const testFileUrl = `https://storage.bunnycdn.com/${storageZone}/${testFilePath}`;
          
          await fetch(testFileUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': apiKey,
              'Content-Type': 'text/plain',
            },
            body: `Department: ${department.name}\nCreated: ${new Date().toISOString()}\nDescription: ${department.description || 'No description'}\nManager: ${department.managerId || 'No manager assigned'}`
          });
        } else {
          console.error(`Failed to create department folder: ${folderPath}`, folderResponse.status);
        }
      }
    } catch (error) {
      console.error('Error creating department folder in BunnyCDN:', error);
      // Don't fail the department creation if folder creation fails
    }

    return NextResponse.json({
      success: true,
      department,
      message: 'Department created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating department:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'A department with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
