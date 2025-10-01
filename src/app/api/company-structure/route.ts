import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch departments with their managers, roles, and users
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        children: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        userDepartments: {
          where: {
            leftAt: null, // Only active users
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                mobile: true,
              },
            },
          },
        },
        departmentRoles: {
          where: {
            isActive: true,
          },
          orderBy: {
            level: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate statistics
    const totalDepartments = departments.length;
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.userDepartments.length, 0);
    const totalRoles = departments.reduce((sum, dept) => sum + dept.departmentRoles.length, 0);
    
    // Get unique locations from user addresses
    const locations = await prisma.user.findMany({
      where: {
        city: {
          not: null,
        },
      },
      select: {
        city: true,
        country: true,
      },
      distinct: ['city', 'country'],
    });

    const response = {
      departments,
      statistics: {
        totalDepartments,
        totalEmployees,
        totalRoles,
        totalLocations: locations.length,
      },
      locations: locations.map(loc => ({
        city: loc.city,
        country: loc.country,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching company structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch company structure" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
