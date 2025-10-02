"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RadarChartComponent } from "@/components/analysis/radar-chart"
import { BarChartComponent } from "@/components/analysis/bar-chart"
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react"
import Link from "next/link"

interface AnalysisData {
  overall_score: number
  score_breakdown: {
    [key: string]: {
      score: number
      impact: string
    }
  }
  key_factors: {
    positive: string[]
    negative: string[]
  }
  recommendations: string[]
  approval_probability: number
}

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('applicationId')
  const loanProductId = searchParams.get('loanProductId')

  const [activeTab, setActiveTab] = useState("visual")
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedReport, setDetailedReport] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    async function fetchOrGenerateAnalysis() {
      if (!applicationId || !loanProductId) {
        setError('Missing application ID or loan product ID')
        setLoading(false)
        return
      }

      try {
        // First, try to fetch existing analysis
        const fetchResponse = await fetch(
          `/api/analysis/generate-report?applicationId=${applicationId}&loanProductId=${loanProductId}`
        )

        if (fetchResponse.ok) {
          const data = await fetchResponse.json()
          setAnalysisData(data.report)
          setLoading(false)
          return
        }

        // If not found, generate new analysis
        if (fetchResponse.status === 404) {
          setGenerating(true)
          const generateResponse = await fetch('/api/analysis/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, loanProductId }),
          })

          const data = await generateResponse.json()

          if (!generateResponse.ok) {
            throw new Error(data.error || 'Failed to generate analysis')
          }

          setAnalysisData(data.report)
        } else {
          throw new Error('Failed to fetch analysis')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis')
      } finally {
        setLoading(false)
        setGenerating(false)
      }
    }

    fetchOrGenerateAnalysis()
  }, [applicationId, loanProductId])

  // Fetch detailed report when tab is activated
  const fetchDetailedReport = async () => {
    if (detailedReport || !applicationId) return

    setLoadingReport(true)
    try {
      const response = await fetch(
        `/api/analysis/detailed-report?applicationId=${applicationId}${loanProductId ? `&loanProductId=${loanProductId}` : ''}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch detailed report')
      }

      const data = await response.json()
      setDetailedReport(data.report)
    } catch (err: any) {
      console.error('Error fetching detailed report:', err)
      setError(err.message || 'Failed to load detailed report')
    } finally {
      setLoadingReport(false)
    }
  }

  // Download PDF report
  const downloadPdfReport = async () => {
    if (!applicationId) return

    setDownloadingPdf(true)
    try {
      const response = await fetch(
        `/api/analysis/download-pdf?applicationId=${applicationId}${loanProductId ? `&loanProductId=${loanProductId}` : ''}`
      )

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FinCare_Analysis_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Transform data for charts
  const categories = analysisData
    ? Object.entries(analysisData.score_breakdown).map(([category, data]) => ({
        category,
        score: data.score,
        maxScore: 100,
        factor: category,
        impact: data.impact === 'High' ? 15 : data.impact === 'Medium' ? 10 : 5,
      }))
    : []

  if (loading || generating) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">
              {generating
                ? 'Generating comprehensive analysis with AI...'
                : 'Loading analysis...'}
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few moments as we analyze your application
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-md">
            <p className="font-semibold">Error loading analysis</p>
            <p className="text-sm mt-1">{error}</p>
            <div className="mt-4 flex gap-2">
              <Link href="/dashboard/loan-options">
                <Button variant="outline" size="sm">Back to Loan Options</Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button variant="outline" size="sm">Complete Documents</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No analysis data found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard/loan-options">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Loan Options
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Creditworthiness Analysis</h1>
            <p className="text-lg text-muted-foreground">AI-powered assessment of your loan application strength</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          if (value === 'report') {
            fetchDetailedReport()
          }
        }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visual">Visual Analysis</TabsTrigger>
            <TabsTrigger value="report">Detailed Report</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loan-Readiness Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan-Readiness Score</CardTitle>
                  <CardDescription>Overall assessment of your application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative h-40 w-40">
                      <svg className="transform -rotate-90 h-40 w-40">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-muted"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - analysisData.overall_score / 100)}`}
                          className="text-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{analysisData.overall_score}</div>
                          <div className="text-xs text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Your application shows <span className="font-semibold text-foreground">strong potential</span> for
                      loan approval
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>Individual category performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">{category.category}</h4>
                        <span className="text-sm font-semibold text-foreground">
                          {category.score}/{category.maxScore}
                        </span>
                      </div>
                      <Progress value={category.score} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <BarChartComponent
              data={categories.map((cat) => ({
                factor: cat.factor,
                impact: cat.impact,
              }))}
            />

            {/* Radar Chart */}
            <RadarChartComponent data={categories} />

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Personalized insights to improve your loan application</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisData.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground flex-1">{rec}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <Link href="/dashboard/documents" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Documents
                </Button>
              </Link>
              <Link href="/dashboard/loan-options" className="w-full sm:w-auto">
                <Button className="w-full">View Recommended Loans</Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-8" onFocus={fetchDetailedReport}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Comprehensive Analysis Report</CardTitle>
                    <CardDescription>AI-generated detailed breakdown of your loan application</CardDescription>
                  </div>
                  <Button
                    onClick={downloadPdfReport}
                    disabled={downloadingPdf || loadingReport}
                    size="sm"
                    className="gap-2"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="text-center py-12 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-lg text-muted-foreground">Generating detailed analysis with AI...</p>
                    <p className="text-sm text-muted-foreground">This may take 5-10 seconds</p>
                  </div>
                ) : detailedReport ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="space-y-6" dangerouslySetInnerHTML={{
                      __html: detailedReport
                        .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-primary mt-8 mb-4 pb-2 border-b-2 border-primary/20">$1</h2>')
                        .replace(/### (.*)/g, '<h3 class="text-xl font-semibold text-foreground mt-6 mb-3">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                        .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
                        .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
                        .replace(/^(.+)$/gm, '<p class="text-muted-foreground leading-relaxed mb-4">$1</p>')
                    }} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={fetchDetailedReport} size="lg" className="gap-2">
                      <Download className="h-5 w-5" />
                      Generate Detailed Report
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Click to generate a comprehensive AI-powered analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
