"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LoanOptionCard } from "@/components/cards/loan-option-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, SlidersHorizontal, Grid3x3, TableIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

interface LoanOption {
  id: string
  bankName: string
  productName: string
  interestRate: string
  tenor: string
  maxAmount: string
  estimatedScore: number
  requiredDocs: string[]
  features: string[]
}

const getBankLogo = (bankName: string): string => {
  const logoMap: Record<string, string> = {
    'Vietcombank': '/vietcombank.svg.png',
    'BIDV': '/BIDV.svg.png',
    'Techcombank': '/techcombank.png',
    'ACB': '/ACB.svg.png',
    'VPBank': '/VPBank.svg.png'
  }
  return logoMap[bankName] || '/vietcombank.svg.png'
}

const mockLoanOptions_OLD = [
  {
    id: 1,
    bankName: "Vietcombank",
    productName: "SME Business Loan",
    interestRate: "8.5% - 10%",
    tenor: "1-5 years",
    maxAmount: "5B VND",
    estimatedScore: 85,
    requiredDocs: ["Business License", "Financial Statements", "Tax Returns", "Collateral Documents"],
    features: [
      "No early repayment penalty",
      "Flexible repayment schedule",
      "Quick approval in 5-7 days",
      "Competitive interest rates",
    ],
  },
  {
    id: 2,
    bankName: "BIDV",
    productName: "Working Capital Loan",
    interestRate: "9% - 11%",
    tenor: "6 months - 3 years",
    maxAmount: "3B VND",
    estimatedScore: 78,
    requiredDocs: ["Business License", "Financial Statements", "Bank Statements", "Business Plan"],
    features: [
      "Fast disbursement",
      "Minimal documentation",
      "Revolving credit facility",
      "Online application available",
    ],
  },
  {
    id: 3,
    bankName: "Techcombank",
    productName: "Growth Financing",
    interestRate: "8% - 9.5%",
    tenor: "1-7 years",
    maxAmount: "10B VND",
    estimatedScore: 72,
    requiredDocs: ["Business License", "Financial Statements", "Tax Returns", "Collateral Documents", "Business Plan"],
    features: ["Higher loan amounts", "Longer repayment terms", "Dedicated relationship manager", "Customizable terms"],
  },
  {
    id: 4,
    bankName: "VPBank",
    productName: "SME Express Loan",
    interestRate: "10% - 12%",
    tenor: "6 months - 2 years",
    maxAmount: "2B VND",
    estimatedScore: 65,
    requiredDocs: ["Business License", "Financial Statements", "Bank Statements"],
    features: ["Quick approval in 24-48 hours", "Minimal collateral required", "Simple application process"],
  },
  {
    id: 5,
    bankName: "ACB",
    productName: "Business Expansion Loan",
    interestRate: "9.5% - 11.5%",
    tenor: "1-5 years",
    maxAmount: "4B VND",
    estimatedScore: 58,
    requiredDocs: ["Business License", "Financial Statements", "Tax Returns", "Business Plan", "Collateral Documents"],
    features: ["Flexible use of funds", "Grace period available", "Competitive rates for existing customers"],
  },
]

export default function LoanOptionsPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('applicationId') || localStorage.getItem('currentApplicationId')

  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  useEffect(() => {
    async function fetchLoanOptions() {
      if (!applicationId) {
        setError('No application ID found. Please submit a loan application first.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/loans/options?applicationId=${applicationId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch loan options')
        }

        setLoanOptions(data.loans || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load loan options')
      } finally {
        setLoading(false)
      }
    }

    fetchLoanOptions()
  }, [applicationId])

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", variant: "default" as const, color: "bg-primary" }
    if (score >= 60) return { label: "Good", variant: "secondary" as const, color: "bg-secondary" }
    return { label: "Fair", variant: "outline" as const, color: "bg-muted" }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading loan options...</p>
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
            <p className="font-semibold">Error loading loan options</p>
            <p className="text-sm mt-1">{error}</p>
            <Link href="/loan-form" className="text-sm underline mt-2 inline-block">
              Go back to loan form
            </Link>
          </div>
        </div>
      </div>
    )
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
                We found {loanOptions.length} loan options based on your requirements
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

        {/* Info Card */}
        <Card className="bg-secondary/50 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Click on any loan option to view details, or use the "Analyze" button to see a comprehensive credit analysis report tailored to that specific loan product.
            </p>
          </CardContent>
        </Card>

        {viewMode === "grid" ? (
          // Grid View - multiple columns
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loanOptions.map((loan: LoanOption, index: number) => (
              <LoanOptionCard key={loan.id} {...loan} rank={index + 1} />
            ))}
          </div>
        ) : (
          // Table View
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
                  {loanOptions.map((loan: LoanOption, index: number) => {
                    const scoreBadge = getScoreBadge(loan.estimatedScore)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          {index === 0 && <Badge className="bg-primary text-primary-foreground mr-2">Best</Badge>}#
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                              <Image
                                src={getBankLogo(loan.bankName)}
                                alt={`${loan.bankName} logo`}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{loan.bankName}</p>
                              <p className="text-sm text-muted-foreground">{loan.productName}</p>
                            </div>
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
                            <Link href="/dashboard/analysis">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href="/dashboard/documents">
                              <Button size="sm">Apply</Button>
                            </Link>
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

        
      </div>
    </div>
  )
}
