"use client"

import { useEffect, useState } from "react"
import { LoanOptionCard } from "@/components/cards/loan-option-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, SlidersHorizontal, Grid3x3, TableIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const mockIndividualLoanOptions = [
  {
    id: "1",
    bankName: "Vietcombank",
    productName: "Personal Loan Plus",
    interestRate: "12% - 15%",
    tenor: "1-5 years",
    maxAmount: "500M VND",
    estimatedScore: 88,
    requiredDocs: ["ID Card", "Income Proof", "Bank Statements"],
    features: ["No collateral required", "Quick approval in 24 hours", "Flexible repayment", "Competitive rates"],
  },
  {
    id: "2",
    bankName: "Techcombank",
    productName: "Vehicle Financing",
    interestRate: "10% - 13%",
    tenor: "2-7 years",
    maxAmount: "2B VND",
    estimatedScore: 82,
    requiredDocs: ["ID Card", "Income Proof", "Vehicle Documents"],
    features: ["Up to 80% financing", "Fast disbursement", "Competitive interest rates", "Flexible down payment"],
  },
  {
    id: "3",
    bankName: "BIDV",
    productName: "Home Loan",
    interestRate: "8% - 11%",
    tenor: "5-20 years",
    maxAmount: "5B VND",
    estimatedScore: 75,
    requiredDocs: ["ID Card", "Income Proof", "Property Documents", "Collateral Appraisal"],
    features: ["Long repayment terms", "Low interest rates", "Up to 70% LTV", "Grace period available"],
  },
  {
    id: "4",
    bankName: "VPBank",
    productName: "Quick Cash Loan",
    interestRate: "15% - 18%",
    tenor: "6 months - 3 years",
    maxAmount: "200M VND",
    estimatedScore: 70,
    requiredDocs: ["ID Card", "Income Proof"],
    features: ["Instant approval", "Minimal documentation", "No collateral", "Online application"],
  },
]

export default function IndividualLoanOptionsPage() {
  const [formData, setFormData] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  useEffect(() => {
    const data = localStorage.getItem("loanFormData")
    if (data) {
      setFormData(JSON.parse(data))
    }
  }, [])

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", variant: "default" as const, color: "bg-primary" }
    if (score >= 60) return { label: "Good", variant: "secondary" as const, color: "bg-secondary" }
    return { label: "Fair", variant: "outline" as const, color: "bg-muted" }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Your Loan Matches</h1>
              <p className="text-lg text-muted-foreground mt-2">
                We found {mockIndividualLoanOptions.length} loan options based on your profile
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="gap-2"
                >
                  <Grid3x3 className="h-4 w-4" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </Button>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {formData && (
          <Card className="bg-secondary/50 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Applicant</p>
                  <p className="font-semibold text-foreground">{formData.fullName || "Individual"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                  <p className="font-semibold text-foreground">
                    {Number(formData.loanAmount || 0).toLocaleString()} VND
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loan Type</p>
                  <p className="font-semibold text-foreground capitalize">
                    {formData.loanType?.replace("-", " ") || "Personal"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockIndividualLoanOptions.map((loan, index) => (
              <LoanOptionCard key={loan.id} {...loan} rank={index + 1} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Bank & Product</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Tenor</TableHead>
                    <TableHead>Max Amount</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIndividualLoanOptions.map((loan, index) => {
                    const scoreBadge = getScoreBadge(loan.estimatedScore)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          {index === 0 && <Badge className="bg-primary text-primary-foreground mr-2">Best</Badge>}#
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{loan.bankName}</p>
                            <p className="text-sm text-muted-foreground">{loan.productName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{loan.interestRate}</TableCell>
                        <TableCell>{loan.tenor}</TableCell>
                        <TableCell>{loan.maxAmount}</TableCell>
                        <TableCell>
                          <Badge variant={scoreBadge.variant}>{loan.estimatedScore}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href="/dashboard-individual/analysis">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button size="sm">Apply</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Need Help Choosing?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              View detailed analysis to understand your approval chances and get personalized recommendations.
            </p>
            <Link href="/dashboard-individual/analysis">
              <Button variant="outline">View Detailed Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
