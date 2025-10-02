"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RadarChartComponent } from "@/components/analysis/radar-chart"
import { BarChartComponent } from "@/components/analysis/bar-chart"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import Link from "next/link"

const mockIndividualAnalysisData = {
  overallScore: 82,
  categories: [
    { category: "Credit Score", score: 88, maxScore: 100, factor: "Credit Score", impact: 18 },
    { category: "Income Stability", score: 85, maxScore: 100, factor: "Income Stability", impact: 15 },
    { category: "Debt-to-Income", score: 75, maxScore: 100, factor: "Debt-to-Income", impact: -5 },
    { category: "Employment History", score: 80, maxScore: 100, factor: "Employment History", impact: 12 },
    { category: "Credit Utilization", score: 78, maxScore: 100, factor: "Credit Utilization", impact: 8 },
    { category: "Payment History", score: 90, maxScore: 100, factor: "Payment History", impact: 20 },
  ],
  recommendations: [
    "Your payment history is excellent, which significantly improves your loan approval chances.",
    "Consider reducing your debt-to-income ratio to qualify for better interest rates.",
    "Your employment stability is a strong factor in your favor.",
    "Maintaining low credit utilization will continue to benefit your credit score.",
  ],
}

export default function IndividualAnalysisPage() {
  const [activeTab, setActiveTab] = useState("visual")

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard-individual/loan-options">
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - mockIndividualAnalysisData.overallScore / 100)}`}
                          className="text-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {mockIndividualAnalysisData.overallScore}
                          </div>
                          <div className="text-xs text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Your application shows <span className="font-semibold text-foreground">excellent potential</span>{" "}
                      for loan approval
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
                  {mockIndividualAnalysisData.categories.map((category, index) => (
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
              data={mockIndividualAnalysisData.categories.map((cat) => ({
                factor: cat.factor,
                impact: cat.impact,
              }))}
            />

            {/* Radar Chart */}
            <RadarChartComponent data={mockIndividualAnalysisData.categories} />

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Personalized insights to improve your loan application</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockIndividualAnalysisData.recommendations.map((rec, index) => (
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
              <Link href="/dashboard-individual/loan-options" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Loan Options
                </Button>
              </Link>
              <Button className="w-full sm:w-auto">Apply for Selected Loan</Button>
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-8">
            <div className="relative">
              <div className="blur-sm pointer-events-none select-none">
                <Card>
                  <CardHeader>
                    <CardTitle>Comprehensive Analysis Report</CardTitle>
                    <CardDescription>Detailed breakdown of all assessment factors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-32 bg-muted rounded-lg" />
                    <div className="h-24 bg-muted rounded-lg" />
                    <div className="h-40 bg-muted rounded-lg" />
                    <div className="h-32 bg-muted rounded-lg" />
                  </CardContent>
                </Card>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="max-w-md shadow-lg">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Download className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Detailed report generation is currently under development. Check back soon for comprehensive PDF
                        reports with in-depth analysis.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
