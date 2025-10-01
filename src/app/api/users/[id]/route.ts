import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: 'Insufficient permissions. Only administrators can update users.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Debug: Log what we received
    console.log('API received body:', body);

    // Update user basic information
    const updateData = {
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone,
      mobile: body.mobile,
      extension: body.extension,
      address: body.address,
      city: body.city,
      zip: body.zip,
      country: body.country,
      image: body.image || null,
    };
    
    console.log('Updating user with data:', updateData);
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle department assignments if provided
    if (body.userDepartments) {
      // Remove existing department relationships
      await prisma.userDepartment.deleteMany({
        where: { userId: id },
      });

      // Create new department relationships
      for (const deptRole of body.userDepartments) {
        await prisma.userDepartment.create({
          data: {
            userId: id,
            departmentId: deptRole.departmentId,
            jobPosition: deptRole.jobPosition,
            isManager: deptRole.isManager,
          },
        });
      }
    }

    // Fetch updated user with department relationships
    const userWithDepartments = await prisma.user.findUnique({
      where: { id },
      include: {
        userDepartments: {
          where: { leftAt: null },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...userWithDepartments,
        createdAt: userWithDepartments?.createdAt.toISOString(),
        updatedAt: userWithDepartments?.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: 'Insufficient permissions. Only administrators can delete users.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if user is trying to delete themselves
    if (user.id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (this will cascade to userDepartments due to Prisma schema)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
