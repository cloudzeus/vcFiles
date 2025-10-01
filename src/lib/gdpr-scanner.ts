import { createHash } from 'crypto';

export interface GdprPattern {
  name: string;
  description: string;
  pattern: RegExp;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'contact' | 'financial' | 'health' | 'identification' | 'other';
}

export interface ScanResult {
  hasPersonalData: boolean;
  personalDataTypes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: Array<{
    pattern: string;
    matches: string[];
    riskLevel: string;
    category: string;
  }>;
  scanDuration: number;
  scanErrors?: string[];
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

// GDPR Patterns for detecting personal data
const GDPR_PATTERNS: GdprPattern[] = [
  // Contact Information
  {
    name: 'Email Address',
    description: 'Standard email address format',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    riskLevel: 'medium',
    category: 'contact'
  },
  {
    name: 'Phone Number',
    description: 'International and local phone number formats',
    pattern: /(\+?[\d\s\-\(\)]{7,})|(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)/g,
    riskLevel: 'medium',
    category: 'contact'
  },
  {
    name: 'Physical Address',
    description: 'Street addresses and postal codes',
    pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Place|Pl|Court|Ct)\b/gi,
    riskLevel: 'high',
    category: 'contact'
  },
  {
    name: 'Postal Code',
    description: 'Various postal code formats',
    pattern: /\b\d{5}(?:[-\s]\d{4})?\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
    riskLevel: 'medium',
    category: 'contact'
  },

  // Financial Information
  {
    name: 'Credit Card Number',
    description: 'Credit card number patterns',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    riskLevel: 'critical',
    category: 'financial'
  },
  {
    name: 'Bank Account Number',
    description: 'Bank account number patterns',
    pattern: /\b\d{8,17}\b/g,
    riskLevel: 'critical',
    category: 'financial'
  },
  {
    name: 'IBAN',
    description: 'International Bank Account Number',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    riskLevel: 'critical',
    category: 'financial'
  },
  {
    name: 'Social Security Number',
    description: 'SSN format (US)',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    riskLevel: 'critical',
    category: 'identification'
  },

  // Health Information
  {
    name: 'Medical Record Number',
    description: 'Medical record identifiers',
    pattern: /\bMRN[:\s-]?\d+\b/gi,
    riskLevel: 'critical',
    category: 'health'
  },
  {
    name: 'Diagnosis Codes',
    description: 'ICD-10 diagnosis codes',
    pattern: /\b[A-Z]\d{2}\.?\d{0,2}\b/g,
    riskLevel: 'high',
    category: 'health'
  },

  // Identification Numbers
  {
    name: 'Passport Number',
    description: 'Passport number patterns',
    pattern: /\b[A-Z]\d{8}\b|\b\d{9}\b/g,
    riskLevel: 'critical',
    category: 'identification'
  },
  {
    name: 'Driver License',
    description: 'Driver license number patterns',
    pattern: /\b[A-Z]\d{7}\b|\b\d{9}\b/g,
    riskLevel: 'critical',
    category: 'identification'
  },
  {
    name: 'National ID',
    description: 'National identification numbers',
    pattern: /\b\d{10,12}\b/g,
    riskLevel: 'critical',
    category: 'identification'
  },

  // Personal Names
  {
    name: 'Full Name',
    description: 'Full name patterns (first + last)',
    pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    riskLevel: 'low',
    category: 'identification'
  },

  // Date of Birth
  {
    name: 'Date of Birth',
    description: 'Date of birth patterns',
    pattern: /\b(?:DOB|Birth|Born)[:\s-]?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
    riskLevel: 'high',
    category: 'identification'
  },

  // Company Information
  {
    name: 'VAT Number',
    description: 'VAT identification numbers',
    pattern: /\b[A-Z]{2}\d{9,12}\b/g,
    riskLevel: 'medium',
    category: 'other'
  },
  {
    name: 'Company Registration',
    description: 'Company registration numbers',
    pattern: /\b(?:Reg|RegNo|Company|Corp)[:\s-]?\d+\b/gi,
    riskLevel: 'medium',
    category: 'other'
  }
];

export class GdprScanner {
  private patterns: GdprPattern[];

  constructor(customPatterns?: GdprPattern[]) {
    this.patterns = customPatterns ? [...GDPR_PATTERNS, ...customPatterns] : GDPR_PATTERNS;
  }

  /**
   * Scan a file for GDPR personal data
   */
  async scanFile(fileInfo: FileInfo): Promise<ScanResult> {
    const startTime = Date.now();
    const detectedPatterns: Array<{
      pattern: string;
      matches: string[];
      riskLevel: string;
      category: string;
    }> = [];

    try {
      // Check if file is text-based and can be scanned
      if (!this.isTextFile(fileInfo.type)) {
        // For non-text files, we'll do a basic scan of the filename
        const fileNameScan = this.scanText(fileInfo.name);
        if (fileNameScan.length > 0) {
          detectedPatterns.push(...fileNameScan);
        }
      } else {
        // Full text content scan
        const contentScan = this.scanText(fileInfo.content);
        detectedPatterns.push(...contentScan);
      }

      // Determine overall risk level
      const riskLevel = this.calculateRiskLevel(detectedPatterns);
      const hasPersonalData = detectedPatterns.length > 0;

      // Extract unique personal data types
      const personalDataTypes = [...new Set(detectedPatterns.map(p => p.pattern))];

      return {
        hasPersonalData,
        personalDataTypes,
        riskLevel,
        detectedPatterns,
        scanDuration: Date.now() - startTime,
        scanErrors: []
      };

    } catch (error) {
      return {
        hasPersonalData: false,
        personalDataTypes: [],
        riskLevel: 'low',
        detectedPatterns: [],
        scanDuration: Date.now() - startTime,
        scanErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Scan text content for personal data patterns
   */
  private scanText(text: string): Array<{
    pattern: string;
    matches: string[];
    riskLevel: string;
    category: string;
  }> {
    const results: Array<{
      pattern: string;
      matches: string[];
      riskLevel: string;
      category: string;
    }> = [];

    for (const pattern of this.patterns) {
      const matches = text.match(pattern.pattern);
      if (matches && matches.length > 0) {
        // Sanitize matches to avoid exposing sensitive data in logs
        const sanitizedMatches = matches.map(match => {
          if (pattern.category === 'financial' || pattern.category === 'identification') {
            // For critical data, only show first and last characters
            return match.length > 4 ? `${match.slice(0, 2)}***${match.slice(-2)}` : '***';
          }
          return match;
        });

        results.push({
          pattern: pattern.name,
          matches: sanitizedMatches,
          riskLevel: pattern.riskLevel,
          category: pattern.category
        });
      }
    }

    return results;
  }

  /**
   * Calculate overall risk level based on detected patterns
   */
  private calculateRiskLevel(detectedPatterns: Array<{ riskLevel: string }>): 'low' | 'medium' | 'high' | 'critical' {
    if (detectedPatterns.length === 0) return 'low';

    const riskScores = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    const maxRisk = Math.max(...detectedPatterns.map(p => riskScores[p.riskLevel as keyof typeof riskScores]));
    
    if (maxRisk >= 4) return 'critical';
    if (maxRisk >= 3) return 'high';
    if (maxRisk >= 2) return 'medium';
    return 'low';
  }

  /**
   * Check if file type is text-based and can be scanned
   */
  private isTextFile(fileType: string): boolean {
    const textExtensions = [
      'txt', 'md', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx',
      'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt',
      'sql', 'csv', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'toml',
      'doc', 'docx', 'pdf', 'rtf', 'odt', 'pages'
    ];

    const extension = fileType.toLowerCase().split('.').pop();
    return textExtensions.includes(extension || '');
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get all available patterns
   */
  getPatterns(): GdprPattern[] {
    return [...this.patterns];
  }

  /**
   * Add custom pattern
   */
  addPattern(pattern: GdprPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove pattern by name
   */
  removePattern(patternName: string): void {
    this.patterns = this.patterns.filter(p => p.name !== patternName);
  }
}

// Export singleton instance
export const gdprScanner = new GdprScanner();

