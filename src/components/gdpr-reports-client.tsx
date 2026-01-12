"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, FileText, CheckCircle, XCircle, RefreshCw, Eye, Folder, File, AlertTriangle, ChevronDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface GdprReport {
  id: string
  status: string
  reportType: string
  startDate: string
  endDate: string
  generatedAt: string
  reportData: any
  user: {
    name: string | null
    email: string
  }
}

interface GdprReportsClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

export default function GdprReportsClient({ user }: GdprReportsClientProps) {
  const [reports, setReports] = useState<GdprReport[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState<GdprReport | null>(null)
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set())
  const [reportType, setReportType] = useState('monthly')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const { toast } = useToast()

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gdpr/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch GDPR reports',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      })
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/gdpr/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'GDPR report generated successfully',
        })
        fetchReports()
      } else {
        const errorMsg = data.error || 'Failed to generate report'
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate GDPR report',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/gdpr/reports/${reportId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `gdpr-report-${reportId}.json`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Success',
          description: 'Report downloaded successfully',
        })
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to download report',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive',
      })
    }
  }

  const viewReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/gdpr/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedReport(data.report)
        setOpenFolders(new Set()) // Reset open folders when viewing new report
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to load report details',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast({
        title: 'Error',
        description: 'Failed to load report details',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'processing').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'failed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  No change from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Latest GDPR compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {report.reportType ? report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1) : 'GDPR'} Compliance Report
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Generated by {report.user.name || report.user.email}
                        </p>
                        {report.startDate && report.endDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        {report.status}
                      </Badge>
                      {report.status === 'completed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewReport(report.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadReport(report.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Complete list of GDPR compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading reports...</div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports available
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">
                            {report.reportType ? report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1) : 'GDPR'} Compliance Report
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Generated by {report.user.name || report.user.email}
                          </p>
                          {report.startDate && report.endDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                            </p>
                          )}
                          {report.reportData?.summary && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {report.reportData.summary.filesWithPersonalData || 0} files with personal data
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">
                          {report.status}
                        </Badge>
                        {report.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Create a new GDPR compliance report for a specific date range
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="reportType">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateReport} 
                disabled={generating || !startDate || !endDate}
                className="w-full"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Details Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>GDPR Compliance Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <>
                  {selectedReport.reportType.charAt(0).toUpperCase() + selectedReport.reportType.slice(1)} Report
                  {' '}• {new Date(selectedReport.startDate).toLocaleDateString()} - {new Date(selectedReport.endDate).toLocaleDateString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && selectedReport.reportData ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Summary Statistics */}
                {selectedReport.reportData.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Files Scanned</p>
                          <p className="text-2xl font-bold">{selectedReport.reportData.summary.totalFilesScanned || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Files with Personal Data</p>
                          <p className="text-2xl font-bold text-orange-600">{selectedReport.reportData.summary.filesWithPersonalData || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Critical Risk</p>
                          <p className="text-2xl font-bold text-red-600">{selectedReport.reportData.summary.criticalRiskFiles || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Folders with Data</p>
                          <p className="text-2xl font-bold">{selectedReport.reportData.summary.foldersWithPersonalData || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No Data Message */}
                {(!selectedReport.reportData.filesByFolder || selectedReport.reportData.filesByFolder.length === 0) &&
                 (!selectedReport.reportData.filesWithPersonalData || selectedReport.reportData.filesWithPersonalData.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No Personal Data Detected</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        No files with personal data were found in the scanned folders.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Files by Folder */}
                {selectedReport.reportData.filesByFolder && selectedReport.reportData.filesByFolder.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Files with Personal Data by Folder</CardTitle>
                      <CardDescription>
                        {selectedReport.reportData.filesByFolder.length} folder(s) contain files with personal data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedReport.reportData.filesByFolder.map((folder: any, idx: number) => {
                          const isOpen = openFolders.has(idx)
                          return (
                            <Collapsible 
                              key={idx} 
                              className="border rounded-lg p-4"
                              open={isOpen}
                              onOpenChange={(open) => {
                                const newOpen = new Set(openFolders)
                                if (open) {
                                  newOpen.add(idx)
                                } else {
                                  newOpen.delete(idx)
                                }
                                setOpenFolders(newOpen)
                              }}
                            >
                              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-gray-50 p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
                                  <Folder className="h-4 w-4" />
                                  <span className="font-medium">{folder.folderPath}</span>
                                  <Badge variant="secondary">{folder.fileCount} files</Badge>
                                  {folder.riskLevels.critical > 0 && (
                                    <Badge variant="destructive">Critical: {folder.riskLevels.critical}</Badge>
                                  )}
                                  {folder.riskLevels.high > 0 && (
                                    <Badge variant="destructive" className="bg-orange-600">High: {folder.riskLevels.high}</Badge>
                                  )}
                                </div>
                              </CollapsibleTrigger>
                            <CollapsibleContent className="mt-4 space-y-2">
                              {folder.files.map((file: any, fileIdx: number) => (
                                <div key={fileIdx} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                                  <File className="h-4 w-4 mt-1 text-gray-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge 
                                        variant={
                                          file.riskLevel === 'critical' ? 'destructive' :
                                          file.riskLevel === 'high' ? 'destructive' :
                                          file.riskLevel === 'medium' ? 'default' :
                                          'secondary'
                                        }
                                        className={
                                          file.riskLevel === 'high' ? 'bg-orange-600' : ''
                                        }
                                      >
                                        {file.riskLevel}
                                      </Badge>
                                      {file.personalDataTypes && file.personalDataTypes.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          Types: {file.personalDataTypes.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Files with Personal Data */}
                {selectedReport.reportData.filesWithPersonalData && selectedReport.reportData.filesWithPersonalData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>All Files with Personal Data</CardTitle>
                      <CardDescription>
                        {selectedReport.reportData.filesWithPersonalData.length} file(s) containing personal data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedReport.reportData.filesWithPersonalData.slice(0, 50).map((file: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2 p-2 border rounded">
                            <File className="h-4 w-4 mt-1 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground truncate">{file.filePath}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant={
                                    file.riskLevel === 'critical' ? 'destructive' :
                                    file.riskLevel === 'high' ? 'destructive' :
                                    file.riskLevel === 'medium' ? 'default' :
                                    'secondary'
                                  }
                                  className={
                                    file.riskLevel === 'high' ? 'bg-orange-600' : ''
                                  }
                                >
                                  {file.riskLevel}
                                </Badge>
                                {file.personalDataTypes && file.personalDataTypes.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {file.personalDataTypes.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedReport.reportData.filesWithPersonalData.length > 50 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            Showing first 50 of {selectedReport.reportData.filesWithPersonalData.length} files. 
                            Download full report for complete list.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Level Breakdown */}
                {selectedReport.reportData.riskLevelBreakdown && Object.keys(selectedReport.reportData.riskLevelBreakdown).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Level Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(selectedReport.reportData.riskLevelBreakdown).map(([level, data]: [string, any]) => (
                          <div key={level} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                level === 'critical' ? 'text-red-600' :
                                level === 'high' ? 'text-orange-600' :
                                level === 'medium' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`} />
                              <span className="font-medium capitalize">{level}</span>
                            </div>
                            <Badge variant="secondary">{data.count} files</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Personal Data Type Breakdown */}
                {selectedReport.reportData.personalDataTypeBreakdown && Object.keys(selectedReport.reportData.personalDataTypeBreakdown).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Data Types Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(selectedReport.reportData.personalDataTypeBreakdown).map(([type, data]: [string, any]) => (
                          <div key={type} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium">{type}</span>
                            <Badge variant="secondary">{data.count} occurrences</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Download Button */}
                <div className="flex justify-end">
                  <Button onClick={() => downloadReport(selectedReport.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Report (JSON)
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading report data...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
