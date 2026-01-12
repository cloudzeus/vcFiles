import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only administrators and managers can download reports
    if (!hasRole(user.role, 'ADMINISTRATOR') && !hasRole(user.role, 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get the report
    const report = await prisma.gdprReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Report is not ready for download' },
        { status: 400 }
      );
    }

    // Format report data as JSON for download
    const reportData = {
      reportId: report.id,
      reportType: report.reportType,
      period: {
        start: report.startDate,
        end: report.endDate
      },
      generatedAt: report.generatedAt,
      generatedBy: {
        name: report.user.name,
        email: report.user.email
      },
      ...report.reportData as any
    };

    // Create JSON string
    const jsonContent = JSON.stringify(reportData, null, 2);
    
    // Create filename with timestamp
    const timestamp = new Date(report.generatedAt).toISOString().split('T')[0];
    const filename = `gdpr-report-${report.reportType}-${timestamp}.json`;

    // Return as downloadable file
    return new NextResponse(jsonContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error downloading GDPR report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
