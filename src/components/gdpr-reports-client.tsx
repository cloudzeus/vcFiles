"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, FileText, CheckCircle, XCircle, RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GdprReport {
  id: string
  status: string
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
    setGenerating(true)
    try {
      const response = await fetch('/api/gdpr/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: '7d',
          reportType: 'all',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'GDPR report generated successfully',
        })
        fetchReports()
      } else {
        throw new Error('Failed to generate report')
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
                        <p className="font-medium">GDPR Compliance Report</p>
                        <p className="text-sm text-muted-foreground">
                          Generated by {report.user.name || report.user.email}
                        </p>
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
                          <p className="font-medium">GDPR Compliance Report</p>
                          <p className="text-sm text-muted-foreground">
                            Generated by {report.user.name || report.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Report ID: {report.id}
                          </p>
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
                Create a new GDPR compliance report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={generateReport} 
                disabled={generating}
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
    </div>
  )
}
