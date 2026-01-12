import { gdprScanner, FileInfo } from './gdpr-scanner';
import { prisma } from './prisma';

export interface ScanProgress {
  totalFiles: number;
  scannedFiles: number;
  filesWithPersonalData: number;
  errors: number;
  currentFile?: string;
  status: 'scanning' | 'completed' | 'error';
}

export interface BulkScanResult {
  success: boolean;
  totalFiles: number;
  scannedFiles: number;
  filesWithPersonalData: number;
  errors: number;
  scanResults: Array<{
    filePath: string;
    fileName: string;
    hasPersonalData: boolean;
    riskLevel: string;
    personalDataTypes: string[];
  }>;
  errorDetails?: string[];
}

/**
 * Scan all files in a folder recursively for personal data
 */
export async function scanFolderRecursively(
  folderPath: string,
  storageZone: string,
  apiKey: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<BulkScanResult> {
  const scanResults: BulkScanResult['scanResults'] = [];
  const errorDetails: string[] = [];
  let totalFiles = 0;
  let scannedFiles = 0;
  let filesWithPersonalData = 0;
  let errors = 0;

  try {
    // First, get all files recursively from the folder
    const allFiles = await getAllFilesRecursively(folderPath, storageZone, apiKey);
    totalFiles = allFiles.length;

    onProgress?.({
      totalFiles,
      scannedFiles: 0,
      filesWithPersonalData: 0,
      errors: 0,
      status: 'scanning'
    });

    // Scan each file
    for (const file of allFiles) {
      try {
        onProgress?.({
          totalFiles,
          scannedFiles,
          filesWithPersonalData,
          errors,
          currentFile: file.path,
          status: 'scanning'
        });

        // Download file content from BunnyCDN
        const fileContent = await downloadFileFromCDN(file.path, storageZone, apiKey);
        
        if (fileContent) {
          // Prepare file info for scanning
          const fileInfo: FileInfo = {
            path: file.path,
            name: file.name,
            size: file.size || 0,
            type: file.type || 'unknown',
            content: fileContent
          };

          // Scan the file
          const scanResult = await gdprScanner.scanFile(fileInfo);

          // Store scan result in database
          const storedScanResult = await prisma.fileScanResult.upsert({
            where: {
              filePath: file.path
            },
            update: {
              fileName: file.name,
              scanStatus: 'completed',
              hasPersonalData: scanResult.hasPersonalData,
              personalDataTypes: JSON.stringify(scanResult.personalDataTypes),
              riskLevel: scanResult.riskLevel,
              fileType: file.type || 'unknown',
              fileSize: file.size || 0,
              contentHash: gdprScanner.generateContentHash(fileContent),
              scanDuration: scanResult.scanDuration,
              scanErrors: scanResult.scanErrors?.join(', ') || null,
              scanVersion: '1.0.0',
              scanDate: new Date()
            },
            create: {
              filePath: file.path,
              fileName: file.name,
              scanStatus: 'completed',
              hasPersonalData: scanResult.hasPersonalData,
              personalDataTypes: JSON.stringify(scanResult.personalDataTypes),
              riskLevel: scanResult.riskLevel,
              fileType: file.type || 'unknown',
              fileSize: file.size || 0,
              contentHash: gdprScanner.generateContentHash(fileContent),
              scanDuration: scanResult.scanDuration,
              scanErrors: scanResult.scanErrors?.join(', ') || null,
              scanVersion: '1.0.0'
            }
          });

          scanResults.push({
            filePath: file.path,
            fileName: file.name,
            hasPersonalData: scanResult.hasPersonalData,
            riskLevel: scanResult.riskLevel,
            personalDataTypes: scanResult.personalDataTypes
          });

          if (scanResult.hasPersonalData) {
            filesWithPersonalData++;
          }

          scannedFiles++;
        } else {
          // File couldn't be downloaded, but we can still scan the filename
          const fileInfo: FileInfo = {
            path: file.path,
            name: file.name,
            size: file.size || 0,
            type: file.type || 'unknown',
            content: ''
          };

          const scanResult = await gdprScanner.scanFile(fileInfo);

          await prisma.fileScanResult.upsert({
            where: {
              filePath: file.path
            },
            update: {
              fileName: file.name,
              scanStatus: 'completed',
              hasPersonalData: scanResult.hasPersonalData,
              personalDataTypes: JSON.stringify(scanResult.personalDataTypes),
              riskLevel: scanResult.riskLevel,
              fileType: file.type || 'unknown',
              fileSize: file.size || 0,
              scanDuration: scanResult.scanDuration,
              scanErrors: 'File content could not be downloaded, only filename scanned',
              scanVersion: '1.0.0',
              scanDate: new Date()
            },
            create: {
              filePath: file.path,
              fileName: file.name,
              scanStatus: 'completed',
              hasPersonalData: scanResult.hasPersonalData,
              personalDataTypes: JSON.stringify(scanResult.personalDataTypes),
              riskLevel: scanResult.riskLevel,
              fileType: file.type || 'unknown',
              fileSize: file.size || 0,
              scanDuration: scanResult.scanDuration,
              scanErrors: 'File content could not be downloaded, only filename scanned',
              scanVersion: '1.0.0'
            }
          });

          scannedFiles++;
        }
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errorDetails.push(`Error scanning ${file.path}: ${errorMsg}`);
        console.error(`Error scanning file ${file.path}:`, error);
      }
    }

    onProgress?.({
      totalFiles,
      scannedFiles,
      filesWithPersonalData,
      errors,
      status: 'completed'
    });

    return {
      success: true,
      totalFiles,
      scannedFiles,
      filesWithPersonalData,
      errors,
      scanResults,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.({
      totalFiles,
      scannedFiles,
      filesWithPersonalData,
      errors,
      status: 'error'
    });

    return {
      success: false,
      totalFiles,
      scannedFiles,
      filesWithPersonalData,
      errors,
      scanResults,
      errorDetails: [errorMsg]
    };
  }
}

/**
 * Get all files recursively from a folder in BunnyCDN
 */
async function getAllFilesRecursively(
  folderPath: string,
  storageZone: string,
  apiKey: string
): Promise<Array<{ path: string; name: string; size?: number; type?: string }>> {
  const allFiles: Array<{ path: string; name: string; size?: number; type?: string }> = [];
  const foldersToProcess: string[] = [folderPath];

  while (foldersToProcess.length > 0) {
    const currentFolder = foldersToProcess.shift()!;
    const normalizedPath = currentFolder.endsWith('/') ? currentFolder : `${currentFolder}/`;
    const listUrl = `https://storage.bunnycdn.com/${storageZone}/${normalizedPath}`;

    try {
      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'AccessKey': apiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data: any[] = await response.json();

        for (const item of data) {
          const itemPath = item.ObjectName || item.name || '';
          const fullPath = normalizedPath + itemPath;

          if (item.IsDirectory || item.type === 'folder' || item.type === 'directory') {
            // It's a folder, add to queue for processing
            foldersToProcess.push(fullPath.replace(/\/$/, ''));
          } else {
            // It's a file, add to list
            const fileName = itemPath.split('/').pop() || itemPath;
            allFiles.push({
              path: fullPath.replace(/\/$/, ''),
              name: fileName,
              size: item.Length || item.size,
              type: getFileTypeFromName(fileName)
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error listing folder ${currentFolder}:`, error);
    }
  }

  return allFiles;
}

/**
 * Download file content from BunnyCDN
 */
async function downloadFileFromCDN(
  filePath: string,
  storageZone: string,
  apiKey: string
): Promise<string | null> {
  try {
    // Only download text-based files (limit to 5MB for safety)
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const fileUrl = `https://storage.bunnycdn.com/${storageZone}/${filePath}`;
    
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'AccessKey': apiKey
      }
    });

    if (!response.ok) {
      return null;
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      console.log(`File ${filePath} is too large (${contentLength} bytes), skipping content scan`);
      return null;
    }

    // Check if it's a text file
    const contentType = response.headers.get('content-type') || '';
    if (!isTextContentType(contentType)) {
      return null;
    }

    const text = await response.text();
    return text;

  } catch (error) {
    console.error(`Error downloading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Check if content type is text-based
 */
function isTextContentType(contentType: string): boolean {
  const textTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-sh',
    'application/x-yaml'
  ];
  
  return textTypes.some(type => contentType.toLowerCase().includes(type));
}

/**
 * Get file type from filename
 */
function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return extension || 'unknown';
}
