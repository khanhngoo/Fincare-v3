"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileUploader } from "@/components/documents/file-uploader"
import { IntegrationConnect } from "@/components/documents/integration-connect"
import { BalanceSheetUploader } from "@/components/documents/balance-sheet-uploader"
import { BankStatementUploader } from "@/components/documents/bank-statement-uploader"
import { MockFileUploader } from "@/components/documents/mock-file-uploader"
import { Plus, Upload, Link2, Edit3, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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
  {
    id: "ownership",
    name: "Ownership",
    description: "CSV file with details of major shareholders/founders",
    required: true,
  },
]

interface DocumentData {
  categoryId: string
  entries: any[]
  status: "empty" | "partial" | "complete"
  lastUpdated?: string
}

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('applicationId') || (typeof window !== 'undefined' ? localStorage.getItem('currentApplicationId') : null)

  const [documentData, setDocumentData] = useState<DocumentData[]>(
    FIXED_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      entries: [],
      status: "empty" as const,
    })),
  )

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data for manual entry
  const [businessIdentityForm, setBusinessIdentityForm] = useState({
    registration_number: '',
    tax_code: '',
    legal_name: ''
  })

  const [financialPerformanceForm, setFinancialPerformanceForm] = useState({
    assets: {
      cash_and_equivalents: { opening: '', closing: '' },
      financial_investments: { opening: '', closing: '' },
      short_term_loans: { opening: '', closing: '' },
      accounts_receivable: { opening: '', closing: '' },
      inventories: { opening: '', closing: '' },
      fixed_assets: { opening: '', closing: '' }
    },
    liabilities: {
      short_term_debt: { opening: '', closing: '' },
      long_term_debt: { opening: '', closing: '' },
      accounts_payable: { opening: '', closing: '' },
      other_liabilities: { opening: '', closing: '' }
    },
    equity: {
      common_stock: { opening: '', closing: '' },
      retained_earnings: { opening: '', closing: '' },
      other_reserves: { opening: '', closing: '' }
    }
  })

  const [bankStatementsForm, setBankStatementsForm] = useState({
    opening_balance: '',
    closing_balance: '',
    total_debit: '',
    total_credit: ''
  })

  const completedCategories = documentData.filter((doc) => doc.status === "complete").length
  const progress = Math.round((completedCategories / FIXED_CATEGORIES.length) * 100)

  // Fetch existing document data
  useEffect(() => {
    async function fetchDocumentData() {
      if (!applicationId) {
        setError('No application ID found')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/documents/save-data?applicationId=${applicationId}`)
        const data = await response.json()

        if (response.ok && data.documents) {
          // Update document data state with fetched data
          setDocumentData(prev => prev.map(doc => {
            const existingDoc = data.documents.find((d: any) => d.category === doc.categoryId)
            if (existingDoc) {
              return {
                ...doc,
                entries: [existingDoc.data],
                status: 'complete' as const,
                lastUpdated: new Date(existingDoc.updated_at).toLocaleDateString()
              }
            }
            return doc
          }))

          // Populate forms with existing data
          data.documents.forEach((doc: any) => {
            if (doc.category === 'business-identity') {
              setBusinessIdentityForm(doc.data)
            } else if (doc.category === 'financial-performance') {
              setFinancialPerformanceForm(doc.data)
            } else if (doc.category === 'bank-statements') {
              setBankStatementsForm(doc.data)
            }
          })
        }
      } catch (err: any) {
        console.error('Error fetching documents:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentData()
  }, [applicationId])

  // Save business identity
  const handleSaveBusinessIdentity = async () => {
    if (!applicationId) return

    setSaving(true)
    try {
      const response = await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          category: 'business-identity',
          data: businessIdentityForm,
          source: 'manual'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save business identity')
      }

      // Update local state
      setDocumentData(prev => prev.map(doc =>
        doc.categoryId === 'business-identity'
          ? { ...doc, entries: [businessIdentityForm], status: 'complete', lastUpdated: new Date().toLocaleDateString() }
          : doc
      ))

      setIsManualModalOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save financial performance
  const handleSaveFinancialPerformance = async () => {
    if (!applicationId) return

    setSaving(true)
    try {
      const response = await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          category: 'financial-performance',
          data: financialPerformanceForm,
          source: 'manual'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save financial performance')
      }

      setDocumentData(prev => prev.map(doc =>
        doc.categoryId === 'financial-performance'
          ? { ...doc, entries: [financialPerformanceForm], status: 'complete', lastUpdated: new Date().toLocaleDateString() }
          : doc
      ))

      setIsManualModalOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save bank statements
  const handleSaveBankStatements = async () => {
    if (!applicationId) return

    setSaving(true)
    try {
      const response = await fetch('/api/documents/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          category: 'bank-statements',
          data: bankStatementsForm,
          source: 'manual'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save bank statements')
      }

      setDocumentData(prev => prev.map(doc =>
        doc.categoryId === 'bank-statements'
          ? { ...doc, entries: [bankStatementsForm], status: 'complete', lastUpdated: new Date().toLocaleDateString() }
          : doc
      ))

      setIsManualModalOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      empty: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
      partial: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      complete: "bg-green-500/10 text-green-700 dark:text-green-400",
    }
    return styles[status as keyof typeof styles] || styles.empty
  }

  const handleAddData = (categoryId: string, method: "upload" | "integrate" | "manual") => {
    setSelectedCategory(categoryId)
    if (method === "upload") {
      setIsUploadModalOpen(true)
    } else if (method === "integrate") {
      setIsIntegrationModalOpen(true)
    } else {
      setIsManualModalOpen(true)
    }
  }

  const handleEditEntry = (categoryId: string, entry: any) => {
    setSelectedCategory(categoryId)
    setSelectedEntry(entry)
    setIsEditModalOpen(true)
  }

  const handleDeleteEntry = (categoryId: string, entryIndex: number) => {
    setDocumentData((prev) =>
      prev.map((doc) => {
        if (doc.categoryId === categoryId) {
          const newEntries = doc.entries.filter((_, index) => index !== entryIndex)
          return {
            ...doc,
            entries: newEntries,
            status: newEntries.length === 0 ? "empty" : doc.status,
          }
        }
        return doc
      }),
    )
  }

  const getCategoryData = (categoryId: string) => {
    return documentData.find((doc) => doc.categoryId === categoryId)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Loading document data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !applicationId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-md">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Document Workspace</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Manage your business information across fixed document categories
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="bg-secondary/50 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Completion Progress</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {completedCategories} of {FIXED_CATEGORIES.length} categories completed
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">{progress}%</div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Table */}
        <Card>
          <CardHeader>
            <CardTitle>Business Document Categories</CardTitle>
            <CardDescription>Add, edit, or delete data within each fixed category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FIXED_CATEGORIES.map((category) => {
                  const data = getCategoryData(category.id)
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.description}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(data?.status || "empty")}`}
                        >
                          {(data?.status || "empty").charAt(0).toUpperCase() + (data?.status || "empty").slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{data?.entries.length || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{data?.lastUpdated || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                              <Plus className="h-4 w-4" />
                              Add Data
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold px-2 py-1.5">Choose input method:</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => handleAddData(category.id, "upload")}
                              >
                                <Upload className="h-4 w-4" />
                                Upload Files
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => handleAddData(category.id, "integrate")}
                              >
                                <Link2 className="h-4 w-4" />
                                Connect Software
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => handleAddData(category.id, "manual")}
                              >
                                <Edit3 className="h-4 w-4" />
                                Manual Entry
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload files for {FIXED_CATEGORIES.find((cat) => cat.id === selectedCategory)?.name || "this category"}
            </DialogDescription>
          </DialogHeader>

          {selectedCategory === 'financial-performance' ? (
            <div className="space-y-4">
              <BalanceSheetUploader
                onDataParsed={(data) => {
                  setFinancialPerformanceForm(data)
                  toast.success('Balance sheet parsed successfully!', {
                    description: 'Financial data has been populated. Review and save the data.'
                  })
                  setIsUploadModalOpen(false)
                  setIsManualModalOpen(true)
                }}
                onError={(error) => {
                  toast.error('Failed to parse balance sheet', {
                    description: error
                  })
                  setError(error)
                }}
              />
            </div>
          ) : selectedCategory === 'bank-statements' ? (
            <div className="space-y-4">
              <BankStatementUploader
                onDataParsed={(data) => {
                  setBankStatementsForm(data)
                  toast.success('Bank statement parsed successfully!', {
                    description: `Found ${data.transaction_count || 0} transactions. Review and save the data.`
                  })
                  setIsUploadModalOpen(false)
                  setIsManualModalOpen(true)
                }}
                onError={(error) => {
                  toast.error('Failed to parse bank statement', {
                    description: error
                  })
                  setError(error)
                }}
              />
            </div>
          ) : selectedCategory === 'business-identity' ? (
            <div className="space-y-4">
              <MockFileUploader
                category="business-identity"
                acceptedFileTypes=".pdf,.docx,.jpg,.png"
                onUploadComplete={(files) => {
                  toast.success('Documents uploaded successfully!', {
                    description: `${files.length} file(s) uploaded (Demo mode - not saved to database)`
                  })
                  setIsUploadModalOpen(false)

                  // Update document status to show completion
                  setDocumentData(prev => prev.map(doc =>
                    doc.categoryId === 'business-identity'
                      ? { ...doc, status: 'complete', lastUpdated: new Date().toLocaleDateString() }
                      : doc
                  ))
                }}
                onError={(error) => {
                  toast.error('Upload failed', {
                    description: error
                  })
                }}
              />
            </div>
          ) : selectedCategory === 'ownership' ? (
            <div className="space-y-4">
              <MockFileUploader
                category="ownership"
                acceptedFileTypes=".csv,.xlsx,.pdf"
                onUploadComplete={(files) => {
                  toast.success('Ownership documents uploaded successfully!', {
                    description: `${files.length} file(s) uploaded (Demo mode - not saved to database)`
                  })
                  setIsUploadModalOpen(false)

                  // Update document status to show completion
                  setDocumentData(prev => prev.map(doc =>
                    doc.categoryId === 'ownership'
                      ? { ...doc, status: 'complete', lastUpdated: new Date().toLocaleDateString() }
                      : doc
                  ))
                }}
                onError={(error) => {
                  toast.error('Upload failed', {
                    description: error
                  })
                }}
              />
            </div>
          ) : (
            <MockFileUploader
              onUploadComplete={(files) => {
                toast.success('Files uploaded successfully!', {
                  description: `${files.length} file(s) uploaded (Demo mode)`
                })
                setIsUploadModalOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Integration Modal */}
      <Dialog open={isIntegrationModalOpen} onOpenChange={setIsIntegrationModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect Software</DialogTitle>
            <DialogDescription>
              Sync data for {FIXED_CATEGORIES.find((cat) => cat.id === selectedCategory)?.name || "this category"} from
              your accounting software
            </DialogDescription>
          </DialogHeader>
          <IntegrationConnect />
        </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manual Entry</DialogTitle>
            <DialogDescription>
              Enter data manually for{" "}
              {FIXED_CATEGORIES.find((cat) => cat.id === selectedCategory)?.name || "this category"}
            </DialogDescription>
          </DialogHeader>
          {selectedCategory === "business-identity" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reg-number">Business Registration Number</Label>
                <Input
                  id="reg-number"
                  placeholder="Enter registration number"
                  value={businessIdentityForm.registration_number}
                  onChange={(e) => setBusinessIdentityForm(prev => ({ ...prev, registration_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-code">Tax Code</Label>
                <Input
                  id="tax-code"
                  placeholder="Enter tax code"
                  value={businessIdentityForm.tax_code}
                  onChange={(e) => setBusinessIdentityForm(prev => ({ ...prev, tax_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal-name">Full Legal Name</Label>
                <Input
                  id="legal-name"
                  placeholder="Enter full legal business name"
                  value={businessIdentityForm.legal_name}
                  onChange={(e) => setBusinessIdentityForm(prev => ({ ...prev, legal_name: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsManualModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBusinessIdentity} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Entry'}
                </Button>
              </div>
            </div>
          )}
          {selectedCategory === "financial-performance" && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Assets</h3>
                {[
                  { label: "Cash and cash equivalents", key: "cash_and_equivalents" },
                  { label: "Financial investments", key: "financial_investments" },
                  { label: "Short-term loans and advances", key: "short_term_loans" },
                  { label: "Accounts receivable", key: "accounts_receivable" },
                  { label: "Inventories", key: "inventories" },
                  { label: "Fixed assets", key: "fixed_assets" },
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-3 gap-4 items-center">
                    <Label className="col-span-1">{item.label}</Label>
                    <Input
                      placeholder="Opening balance"
                      type="number"
                      value={financialPerformanceForm.assets[item.key as keyof typeof financialPerformanceForm.assets].opening}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        assets: {
                          ...prev.assets,
                          [item.key]: { ...prev.assets[item.key as keyof typeof prev.assets], opening: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Closing balance"
                      type="number"
                      value={financialPerformanceForm.assets[item.key as keyof typeof financialPerformanceForm.assets].closing}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        assets: {
                          ...prev.assets,
                          [item.key]: { ...prev.assets[item.key as keyof typeof prev.assets], closing: e.target.value }
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Liabilities</h3>
                {[
                  { label: "Short-term debt", key: "short_term_debt" },
                  { label: "Long-term debt", key: "long_term_debt" },
                  { label: "Accounts payable", key: "accounts_payable" },
                  { label: "Other liabilities", key: "other_liabilities" }
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-3 gap-4 items-center">
                    <Label className="col-span-1">{item.label}</Label>
                    <Input
                      placeholder="Opening balance"
                      type="number"
                      value={financialPerformanceForm.liabilities[item.key as keyof typeof financialPerformanceForm.liabilities].opening}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        liabilities: {
                          ...prev.liabilities,
                          [item.key]: { ...prev.liabilities[item.key as keyof typeof prev.liabilities], opening: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Closing balance"
                      type="number"
                      value={financialPerformanceForm.liabilities[item.key as keyof typeof financialPerformanceForm.liabilities].closing}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        liabilities: {
                          ...prev.liabilities,
                          [item.key]: { ...prev.liabilities[item.key as keyof typeof prev.liabilities], closing: e.target.value }
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Equity</h3>
                {[
                  { label: "Common stock", key: "common_stock" },
                  { label: "Retained earnings", key: "retained_earnings" },
                  { label: "Other reserves", key: "other_reserves" }
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-3 gap-4 items-center">
                    <Label className="col-span-1">{item.label}</Label>
                    <Input
                      placeholder="Opening balance"
                      type="number"
                      value={financialPerformanceForm.equity[item.key as keyof typeof financialPerformanceForm.equity].opening}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        equity: {
                          ...prev.equity,
                          [item.key]: { ...prev.equity[item.key as keyof typeof prev.equity], opening: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Closing balance"
                      type="number"
                      value={financialPerformanceForm.equity[item.key as keyof typeof financialPerformanceForm.equity].closing}
                      onChange={(e) => setFinancialPerformanceForm(prev => ({
                        ...prev,
                        equity: {
                          ...prev.equity,
                          [item.key]: { ...prev.equity[item.key as keyof typeof prev.equity], closing: e.target.value }
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsManualModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFinancialPerformance} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Financial Data'}
                </Button>
              </div>
            </div>
          )}
          {selectedCategory === "bank-statements" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="opening-balance">Opening Balance</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  placeholder="Enter opening balance"
                  value={bankStatementsForm.opening_balance}
                  onChange={(e) => setBankStatementsForm(prev => ({ ...prev, opening_balance: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing-balance">Closing Balance</Label>
                <Input
                  id="closing-balance"
                  type="number"
                  placeholder="Enter closing balance"
                  value={bankStatementsForm.closing_balance}
                  onChange={(e) => setBankStatementsForm(prev => ({ ...prev, closing_balance: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-debit">Total Debit</Label>
                <Input
                  id="total-debit"
                  type="number"
                  placeholder="Enter total debit amount"
                  value={bankStatementsForm.total_debit}
                  onChange={(e) => setBankStatementsForm(prev => ({ ...prev, total_debit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-credit">Total Credit</Label>
                <Input
                  id="total-credit"
                  type="number"
                  placeholder="Enter total credit amount"
                  value={bankStatementsForm.total_credit}
                  onChange={(e) => setBankStatementsForm(prev => ({ ...prev, total_credit: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsManualModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBankStatements} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Bank Statements'}
                </Button>
              </div>
            </div>
          )}
          {selectedCategory === "ownership" && (
            <div className="space-y-4 py-4">
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Upload Ownership CSV</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Please upload a CSV file with details of major shareholders and founders
                  </p>
                </div>
                <Input type="file" accept=".csv" className="max-w-md mx-auto" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsManualModalOpen(false)}>
                  Cancel
                </Button>
                <Button>Upload CSV</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
