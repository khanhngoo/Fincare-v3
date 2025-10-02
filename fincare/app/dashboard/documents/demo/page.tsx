"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

const FIXED_CATEGORIES = [
  {
    id: "business-identity",
    name: "Business Identity",
    description: "Business registration number, Tax Code, Full Legal Name",
    required: true,
  },
  {
    id: "financial-performance",
    name: "Financial Performance",
    description: "Assets, Liabilities, and Equity with opening and closing balances",
    required: true,
  },
  {
    id: "bank-statements",
    name: "Bank Statements",
    description: "CSV file with transaction details",
    required: true,
  },
]

// Demo data - pre-filled with realistic values
const DEMO_DATA = {
  businessIdentity: {
    registration_number: '0123456789',
    tax_code: 'TC-8765432109',
    legal_name: 'TechViet Solutions JSC'
  },
  financialPerformance: {
    assets: {
      cash_and_equivalents: { opening: '5000000000', closing: '6500000000' },
      financial_investments: { opening: '2000000000', closing: '2500000000' },
      short_term_loans: { opening: '1500000000', closing: '1800000000' },
      accounts_receivable: { opening: '3000000000', closing: '3500000000' },
      inventories: { opening: '4000000000', closing: '4200000000' },
      fixed_assets: { opening: '10000000000', closing: '9800000000' }
    },
    liabilities: {
      short_term_debt: { opening: '2000000000', closing: '1800000000' },
      long_term_debt: { opening: '5000000000', closing: '4500000000' },
      accounts_payable: { opening: '1500000000', closing: '1600000000' },
      other_liabilities: { opening: '500000000', closing: '400000000' }
    },
    equity: {
      common_stock: { opening: '10000000000', closing: '10000000000' },
      retained_earnings: { opening: '5000000000', closing: '6500000000' },
      other_reserves: { opening: '1500000000', closing: '1500000000' }
    }
  },
  bankStatements: {
    opening_balance: '5000000000',
    closing_balance: '6500000000',
    total_debit: '25000000000',
    total_credit: '26500000000'
  }
}

export default function DemoDocumentsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [demoApplicationId, setDemoApplicationId] = useState<string | null>(null)

  // Create demo application on mount
  useEffect(() => {
    createDemoApplication()
  }, [])

  const createDemoApplication = async () => {
    try {
      // Create a demo loan application
      const response = await fetch('/api/loans/calculate-baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: 'TechViet Solutions JSC',
          loanAmount: 3000000000,
          loanPurpose: 'business-expansion',
          annualRevenue: 'over-10b',
          timeInBusiness: '3-plus-years'
        })
      })

      const data = await response.json()

      if (response.ok && data.application) {
        setDemoApplicationId(data.application.id)
        localStorage.setItem('demoApplicationId', data.application.id)

        // Auto-save demo documents
        await saveDemoDocuments(data.application.id)
      }
    } catch (err) {
      console.error('Error creating demo application:', err)
    }
  }

  const saveDemoDocuments = async (appId: string) => {
    setSaving(true)
    try {
      // Save business identity
      await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          category: 'business-identity',
          data: DEMO_DATA.businessIdentity,
          source: 'demo'
        })
      })

      // Save financial performance
      await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          category: 'financial-performance',
          data: DEMO_DATA.financialPerformance,
          source: 'demo'
        })
      })

      // Save bank statements
      await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          category: 'bank-statements',
          data: DEMO_DATA.bankStatements,
          source: 'demo'
        })
      })

      console.log('Demo documents saved successfully')
    } catch (err) {
      console.error('Error saving demo documents:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(value))
  }

  const goToAnalysis = () => {
    if (demoApplicationId) {
      router.push(`/dashboard/analysis?applicationId=${demoApplicationId}`)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Demo: All Documents Complete</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Pre-filled with sample data from TechViet Solutions JSC
              </p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Completion Progress</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All 4 categories completed with demo data
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600">100%</div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: '100%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Identity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Business Identity
                </CardTitle>
                <CardDescription>Company registration and tax information</CardDescription>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                Complete
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-medium">{DEMO_DATA.businessIdentity.registration_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Code</p>
                <p className="font-medium">{DEMO_DATA.businessIdentity.tax_code}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Legal Name</p>
              <p className="font-medium">{DEMO_DATA.businessIdentity.legal_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Performance Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Financial Performance
                </CardTitle>
                <CardDescription>Balance sheet with assets, liabilities, and equity</CardDescription>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                Complete
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Assets Summary */}
              <div>
                <h4 className="font-semibold mb-3">Assets Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Assets (Opening)</p>
                    <p className="font-medium">{formatCurrency('25500000000')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Assets (Closing)</p>
                    <p className="font-medium text-green-600">{formatCurrency('28300000000')}</p>
                  </div>
                </div>
              </div>

              {/* Liabilities Summary */}
              <div>
                <h4 className="font-semibold mb-3">Liabilities Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Liabilities (Opening)</p>
                    <p className="font-medium">{formatCurrency('9000000000')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Liabilities (Closing)</p>
                    <p className="font-medium text-green-600">{formatCurrency('8300000000')}</p>
                  </div>
                </div>
              </div>

              {/* Equity Summary */}
              <div>
                <h4 className="font-semibold mb-3">Equity Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Equity (Opening)</p>
                    <p className="font-medium">{formatCurrency('16500000000')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Equity (Closing)</p>
                    <p className="font-medium text-green-600">{formatCurrency('18000000000')}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Statements Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Bank Statements
                </CardTitle>
                <CardDescription>Banking activity and cash flow</CardDescription>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                Complete
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="font-medium">{formatCurrency(DEMO_DATA.bankStatements.opening_balance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closing Balance</p>
                <p className="font-medium text-green-600">{formatCurrency(DEMO_DATA.bankStatements.closing_balance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="font-medium">{formatCurrency(DEMO_DATA.bankStatements.total_debit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credit</p>
                <p className="font-medium">{formatCurrency(DEMO_DATA.bankStatements.total_credit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <h3 className="font-semibold text-lg">Ready to View Analysis</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All documents are complete. Click below to see the AI-powered analysis and detailed report.
            </p>
          </div>
          <Button
            onClick={goToAnalysis}
            disabled={saving || !demoApplicationId}
            size="lg"
            className="gap-2 whitespace-nowrap"
          >
            {saving ? (
              'Setting up...'
            ) : (
              <>
                View Analysis
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2">About This Demo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Company:</strong> TechViet Solutions JSC - An established tech company</li>
              <li>• <strong>Financial Health:</strong> Strong assets of 28.3B VND, decreasing liabilities</li>
              <li>• <strong>Loan Request:</strong> 3B VND for business expansion</li>
              <li>• <strong>Expected Score:</strong> High creditworthiness (85-90 range)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
