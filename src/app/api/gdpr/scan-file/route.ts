import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { gdprScanner, FileInfo } from '@/lib/gdpr-scanner';

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
    const { filePath, fileName, fileType, fileSize, content } = body;

    if (!filePath || !fileName) {
      return NextResponse.json(
        { success: false, error: 'File path and name are required' },
        { status: 400 }
      );
    }

    // Check if we already have a recent scan result
    const existingScan = await prisma.fileScanResult.findFirst({
      where: {
        filePath,
        scanDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        scanDate: 'desc'
      }
    });

    if (existingScan) {
      return NextResponse.json({
        success: true,
        scanResult: {
          ...existingScan,
          personalDataTypes: existingScan.personalDataTypes ? JSON.parse(existingScan.personalDataTypes) : [],
          fromCache: true
        }
      });
    }

    // Prepare file info for scanning
    const fileInfo: FileInfo = {
      path: filePath,
      name: fileName,
      size: fileSize || 0,
      type: fileType || 'unknown',
      content: content || ''
    };

    // Scan the file for GDPR compliance
    const scanResult = await gdprScanner.scanFile(fileInfo);

    // Store scan result in database
    const storedScanResult = await prisma.fileScanResult.create({
      data: {
        filePath,
        fileName,
        scanStatus: 'completed',
        hasPersonalData: scanResult.hasPersonalData,
        personalDataTypes: JSON.stringify(scanResult.personalDataTypes),
        riskLevel: scanResult.riskLevel,
        fileType: fileType || 'unknown',
        fileSize: fileSize || 0,
        contentHash: gdprScanner.generateContentHash(content || ''),
        scanDuration: scanResult.scanDuration,
        scanErrors: scanResult.scanErrors?.join(', ') || null,
        scanVersion: '1.0.0'
      }
    });

    return NextResponse.json({
      success: true,
      scanResult: {
        ...storedScanResult,
        personalDataTypes: scanResult.personalDataTypes,
        detectedPatterns: scanResult.detectedPatterns
      }
    });

  } catch (error) {
    console.error('Error scanning file for GDPR compliance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Get scan result for the file
    const scanResult = await prisma.fileScanResult.findFirst({
      where: { filePath },
      orderBy: { scanDate: 'desc' }
    });

    if (!scanResult) {
      return NextResponse.json({
        success: true,
        scanResult: null,
        message: 'No scan result found for this file'
      });
    }

    return NextResponse.json({
      success: true,
      scanResult: {
        ...scanResult,
        personalDataTypes: scanResult.personalDataTypes ? JSON.parse(scanResult.personalDataTypes) : []
      }
    });

  } catch (error) {
    console.error('Error fetching file scan result:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

