import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper to compute financial metrics from document data
function computeFinancialMetrics(documentData: any) {
  const metrics: any = {
    annual_revenue: null,
    total_assets: null,
    total_liabilities: null,
    total_equity: null,
    current_ratio: null,
    debt_to_equity: null,
    profit_margin: null,
    opening_balance: null,
    closing_balance: null,
    total_debit: null,
    total_credit: null,
    extracted_data: {}
  }

  // Get financial performance data
  const financialPerf = documentData['financial-performance']
  if (financialPerf) {
    const data = financialPerf.data

    // Calculate total assets
    if (data.assets) {
      metrics.total_assets = Object.values(data.assets).reduce((sum: any, item: any) => {
        return sum + (Number(item.closing) || 0)
      }, 0)
    }

    // Calculate total liabilities
    if (data.liabilities) {
      metrics.total_liabilities = Object.values(data.liabilities).reduce((sum: any, item: any) => {
        return sum + (Number(item.closing) || 0)
      }, 0)
    }

    // Calculate total equity
    if (data.equity) {
      metrics.total_equity = Object.values(data.equity).reduce((sum: any, item: any) => {
        return sum + (Number(item.closing) || 0)
      }, 0)
    }

    // Calculate ratios
    if (metrics.total_assets && metrics.total_liabilities) {
      metrics.current_ratio = (metrics.total_assets / metrics.total_liabilities).toFixed(2)
    }

    if (metrics.total_equity && metrics.total_liabilities && metrics.total_equity > 0) {
      metrics.debt_to_equity = (metrics.total_liabilities / metrics.total_equity).toFixed(2)
    }

    metrics.extracted_data.financial_performance = data
  }

  // Get bank statement data
  const bankStatements = documentData['bank-statements']
  if (bankStatements) {
    const data = bankStatements.data
    metrics.opening_balance = data.opening_balance
    metrics.closing_balance = data.closing_balance
    metrics.total_debit = data.total_debit
    metrics.total_credit = data.total_credit
    metrics.extracted_data.bank_statements = data
  }

  // Get business identity
  const businessIdentity = documentData['business-identity']
  if (businessIdentity) {
    metrics.extracted_data.business_identity = businessIdentity.data
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

    const { applicationId, category, data, source } = await request.json()

    if (!applicationId || !category || !data || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, category, data, or source' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['business-identity', 'financial-performance', 'bank-statements']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      )
    }

    // Upsert document data
    const { data: documentData, error: docError } = await supabase
      .from('document_data')
      .upsert({
        application_id: applicationId,
        category,
        data,
        source
      }, {
        onConflict: 'application_id,category'
      })
      .select()
      .single()

    if (docError) {
      console.error('Error saving document data:', docError)
      return NextResponse.json(
        { error: 'Failed to save document data' },
        { status: 500 }
      )
    }

    // Fetch all document data for this application to compute metrics
    const { data: allDocs, error: allDocsError } = await supabase
      .from('document_data')
      .select('*')
      .eq('application_id', applicationId)

    if (!allDocsError && allDocs) {
      // Convert array to object keyed by category
      const docsObject = allDocs.reduce((acc: any, doc: any) => {
        acc[doc.category] = doc
        return acc
      }, {})

      // Compute financial metrics
      const metrics = computeFinancialMetrics(docsObject)

      // Upsert financial metrics
      const { error: metricsError } = await supabase
        .from('financial_metrics')
        .upsert({
          application_id: applicationId,
          ...metrics
        }, {
          onConflict: 'application_id'
        })

      if (metricsError) {
        console.error('Error updating financial metrics:', metricsError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      documentData
    })

  } catch (error) {
    console.error('Error in save-data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve document data
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const applicationId = searchParams.get('applicationId')
    const category = searchParams.get('category')

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Missing applicationId parameter' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('document_data')
      .select('*')
      .eq('application_id', applicationId)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching document data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch document data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents: data
    })

  } catch (error) {
    console.error('Error in GET save-data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
