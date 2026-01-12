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
    const { folderPath } = body;

    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // Administrators have access to all folders
    if (hasRole(user.role, 'ADMINISTRATOR')) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        reason: 'Administrator access',
        userRole: user.role
      });
    }

    // Parse the folder path to determine access level
    const pathParts = folderPath.split('/');
    
    // Check if it's a department folder
    if (pathParts.includes('departments') && pathParts.length >= 4) {
      const departmentName = pathParts[3]; // prismafiles/vculture/departments/[departmentName]
      
      // Check if user is associated with this department
      const userDepartment = await prisma.userDepartment.findFirst({
        where: {
          userId: user.id,
          leftAt: null, // Only active memberships
          department: {
            name: departmentName
          }
        }
      });

      if (userDepartment) {
        return NextResponse.json({
          success: true,
          hasAccess: true,
          reason: `Member of ${departmentName} department`,
          userRole: user.role,
          departmentRole: userDepartment.jobPosition
        });
      }
    }

    // Check if it's a user's personal folder
    if (pathParts.includes('users') && pathParts.length >= 4) {
      const userId = pathParts[3]; // prismafiles/vculture/users/[userId]
      
      // Users can access their own folder
      if (userId === user.id) {
        return NextResponse.json({
          success: true,
          hasAccess: true,
          reason: 'Personal folder access',
          userRole: user.role
        });
      }
    }

    // Check if it's a root folder (departments, users)
    if (pathParts.length === 3 && (pathParts[2] === 'departments' || pathParts[2] === 'users')) {
      // Users can list root folders but not access individual department/user folders
      return NextResponse.json({
        success: true,
        hasAccess: true,
        reason: 'Root folder listing access',
        userRole: user.role
      });
    }

    // No access granted
    return NextResponse.json({
      success: true,
      hasAccess: false,
      reason: 'Insufficient permissions',
      userRole: user.role,
      requiredRole: 'ADMINISTRATOR or department membership'
    });

  } catch (error) {
    console.error('Error checking folder access:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
