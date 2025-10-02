import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

// Helper function to extract financial metrics from parsed CSV data
function extractFinancialMetrics(csvData: any[], category: string) {
  const metrics: any = {
    annual_revenue: null,
    total_assets: null,
    total_liabilities: null,
    current_ratio: null,
    debt_to_equity: null,
    profit_margin: null,
    extracted_data: {},
  }

  try {
    // Different extraction logic based on document category
    if (category === 'balance-sheet') {
      // Find total assets and liabilities from balance sheet
      csvData.forEach((row: any) => {
        const rowName = Object.values(row)[0]?.toString().toLowerCase() || ''

        if (rowName.includes('total assets') || rowName.includes('tổng tài sản')) {
          const value = Object.values(row).find(v => typeof v === 'number' || !isNaN(Number(v)))
          metrics.total_assets = value ? Number(value) : null
        }

        if (rowName.includes('total liabilities') || rowName.includes('tổng nợ phải trả')) {
          const value = Object.values(row).find(v => typeof v === 'number' || !isNaN(Number(v)))
          metrics.total_liabilities = value ? Number(value) : null
        }
      })

      // Calculate debt-to-equity if we have the data
      if (metrics.total_assets && metrics.total_liabilities) {
        const equity = metrics.total_assets - metrics.total_liabilities
        if (equity > 0) {
          metrics.debt_to_equity = (metrics.total_liabilities / equity).toFixed(2)
        }
      }
    }

    if (category === 'income-statement' || category === 'profit-loss') {
      // Find revenue and profit from income statement
      csvData.forEach((row: any) => {
        const rowName = Object.values(row)[0]?.toString().toLowerCase() || ''

        if (rowName.includes('revenue') || rowName.includes('doanh thu')) {
          const value = Object.values(row).find(v => typeof v === 'number' || !isNaN(Number(v)))
          metrics.annual_revenue = value ? Number(value) : null
        }

        if (rowName.includes('net profit') || rowName.includes('lợi nhuận')) {
          const value = Object.values(row).find(v => typeof v === 'number' || !isNaN(Number(v)))
          const netProfit = value ? Number(value) : null

          if (netProfit && metrics.annual_revenue) {
            metrics.profit_margin = ((netProfit / metrics.annual_revenue) * 100).toFixed(2)
          }
        }
      })
    }

    if (category === 'cash-flow') {
      // Extract cash flow metrics
      csvData.forEach((row: any) => {
        const rowName = Object.values(row)[0]?.toString().toLowerCase() || ''

        if (rowName.includes('operating cash flow') || rowName.includes('lưu chuyển tiền')) {
          const value = Object.values(row).find(v => typeof v === 'number' || !isNaN(Number(v)))
          metrics.extracted_data.operating_cash_flow = value ? Number(value) : null
        }
      })
    }

    // Store the full CSV data for reference
    metrics.extracted_data.raw_csv = csvData.slice(0, 50) // Limit to first 50 rows

  } catch (error) {
    console.error('Error extracting metrics:', error)
  }

  return metrics
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { filePath, applicationId, category } = await request.json()

    if (!filePath || !applicationId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Convert blob to text
    const csvText = await fileData.text()

    // Parse CSV
    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      })
    })

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors)
    }

    // Extract financial metrics
    const metrics = extractFinancialMetrics(parseResult.data, category)

    // Check if financial metrics already exist for this application
    const { data: existingMetrics } = await supabase
      .from('financial_metrics')
      .select('id')
      .eq('application_id', applicationId)
      .single()

    let savedMetrics

    if (existingMetrics) {
      // Update existing metrics
      const { data, error } = await supabase
        .from('financial_metrics')
        .update({
          ...metrics,
          file_metadata: {
            file_path: filePath,
            category,
            rows_count: parseResult.data.length,
            processed_at: new Date().toISOString()
          }
        })
        .eq('id', existingMetrics.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating metrics:', error)
        return NextResponse.json(
          { error: 'Failed to update financial metrics' },
          { status: 500 }
        )
      }
      savedMetrics = data
    } else {
      // Insert new metrics
      const { data, error } = await supabase
        .from('financial_metrics')
        .insert({
          application_id: applicationId,
          ...metrics,
          file_metadata: {
            file_path: filePath,
            category,
            rows_count: parseResult.data.length,
            processed_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting metrics:', error)
        return NextResponse.json(
          { error: 'Failed to save financial metrics' },
          { status: 500 }
        )
      }
      savedMetrics = data
    }

    return NextResponse.json({
      success: true,
      metrics: savedMetrics,
      rowsProcessed: parseResult.data.length
    })

  } catch (error) {
    console.error('Error in document processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
