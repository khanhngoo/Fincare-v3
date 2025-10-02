'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseBalanceSheetFile, validateBalanceSheetData } from '@/lib/csv-parsers/balance-sheet-parser'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BalanceSheetUploaderProps {
  onDataParsed: (data: any) => void
  onError?: (error: string) => void
}

export function BalanceSheetUploader({ onDataParsed, onError }: BalanceSheetUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [parseStatus, setParseStatus] = useState<{
    success: boolean
    message: string
    errors?: string[]
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
      const parsedData = await parseBalanceSheetFile(file)

      // Validate the parsed data
      const validation = validateBalanceSheetData(parsedData)

      if (validation.valid) {
        setParseStatus({
          success: true,
          message: 'Balance sheet parsed successfully! Data has been populated.'
        })
        onDataParsed(parsedData)
      } else {
        setParseStatus({
          success: false,
          message: 'Balance sheet parsed with warnings. Please review the data.',
          errors: validation.errors
        })
        // Still populate the data even with warnings
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

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold mb-1">Upload Balance Sheet CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your balance sheet in CSV format. The file should include assets, liabilities, and equity.
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
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2">Expected CSV Format:</h4>
        <div className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
          <pre>{`Item,Code,NoteRef,Current Year,Prior Year
Cash and cash equivalents,110,V.01,8000000000,5000000000
Financial investments,120,V.02,1200000000,900000000
Inventories,140,,7500000000,6720000000
Fixed assets (net),150,,10000000000,8600000000
...`}</pre>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The parser will automatically map "Current Year" to closing balance and "Prior Year" to opening balance.
        </p>
      </div>
    </div>
  )
}
