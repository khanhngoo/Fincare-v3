'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseBankStatementFile, validateBankStatementData, analyzeBankStatement } from '@/lib/csv-parsers/bank-statement-parser'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

interface BankStatementUploaderProps {
  onDataParsed: (data: any) => void
  onError?: (error: string) => void
}

export function BankStatementUploader({ onDataParsed, onError }: BankStatementUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [parseStatus, setParseStatus] = useState<{
    success: boolean
    message: string
    errors?: string[]
    warnings?: string[]
    summary?: any
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParseStatus(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setParseStatus(null)

    try {
      // Parse the CSV file
      const parsedData = await parseBankStatementFile(file)

      // Validate the parsed data
      const validation = validateBankStatementData(parsedData)

      // Get detailed analysis
      const fileContent = await file.text()
      const analysis = analyzeBankStatement(fileContent)

      if (validation.valid) {
        setParseStatus({
          success: true,
          message: `Bank statement parsed successfully! Found ${parsedData.transaction_count || 0} transactions.`,
          warnings: validation.warnings,
          summary: analysis
        })
        onDataParsed(parsedData)
      } else {
        setParseStatus({
          success: false,
          message: 'Bank statement parsed with errors. Please review the data.',
          errors: validation.errors,
          warnings: validation.warnings,
          summary: analysis
        })
        // Still populate the data even with errors
        onDataParsed(parsedData)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file'
      setParseStatus({
        success: false,
        message: errorMessage
      })
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(amount))
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold mb-1">Upload Bank Statement CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your bank statement in CSV format with transaction details.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full max-w-md">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="shrink-0"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>
      </div>

      {parseStatus && (
        <>
          <Alert variant={parseStatus.success ? 'default' : 'destructive'}>
            {parseStatus.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <p className="font-medium">{parseStatus.message}</p>
              {parseStatus.errors && parseStatus.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm">
                  {parseStatus.errors.map((error, idx) => (
                    <li key={idx} className="text-destructive">{error}</li>
                  ))}
                </ul>
              )}
              {parseStatus.warnings && parseStatus.warnings.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm">
                  {parseStatus.warnings.map((warning, idx) => (
                    <li key={idx} className="text-yellow-600 dark:text-yellow-500">{warning}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>

          {parseStatus.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-xl font-bold">{parseStatus.summary.summary.transaction_count || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Debit</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(parseStatus.summary.summary.total_debit || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Credit</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(parseStatus.summary.summary.total_credit || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {parseStatus.summary?.byCategory && (
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3">Transaction Categories</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(parseStatus.summary.byCategory).map(([category, data]: [string, any]) => (
                    data.count > 0 && (
                      <div key={category} className="text-sm">
                        <p className="font-medium capitalize">{category}</p>
                        <p className="text-xs text-muted-foreground">{data.count} transactions</p>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2">Expected CSV Format:</h4>
        <div className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
          <pre>{`Transaction date,Remitter,Remitter bank,Details,Transaction No.,Debit,Credit,Fee/Interest,Tax,Balance
2024-07-01,,,Opening balance,,0,0,0,0,820000000
2024-07-01,Company A,BIDV,Payment,FT001,50000,0,0,0,770000000
2024-07-02,Company B,ACB,Receipt,FT002,0,100000,0,0,870000000
...
2024-07-31,,,Ending balance,,0,0,0,0,2840626515`}</pre>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The parser will automatically extract opening/closing balances and sum all debits/credits.
        </p>
      </div>
    </div>
  )
}
