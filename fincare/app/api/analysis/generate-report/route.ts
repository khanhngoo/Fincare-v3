import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTailoredAnalysis } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

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

    const { applicationId, loanProductId, financialMetrics: providedMetrics } = await request.json()

    if (!applicationId || !loanProductId) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId or loanProductId' },
        { status: 400 }
      )
    }

    // Check if analysis already exists
    const { data: existingReport } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('application_id', applicationId)
      .eq('loan_product_id', loanProductId)
      .single()

    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        cached: true
      })
    }

    // Fetch loan application
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Try to fetch financial metrics from database first
    let financialMetrics = null
    const { data: dbMetrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('application_id', applicationId)
      .single()

    if (!metricsError && dbMetrics) {
      financialMetrics = dbMetrics
    } else if (providedMetrics) {
      // Use metrics provided from client (localStorage)
      financialMetrics = providedMetrics
    } else {
      // No metrics available
      return NextResponse.json(
        { error: 'Financial metrics not found. Please upload and process documents first.' },
        { status: 404 }
      )
    }

    // Fetch loan product
    const { data: loanProduct, error: productError } = await supabase
      .from('loan_products')
      .select('*')
      .eq('id', loanProductId)
      .single()

    if (productError || !loanProduct) {
      return NextResponse.json(
        { error: 'Loan product not found' },
        { status: 404 }
      )
    }

    // Generate tailored analysis using Gemini API
    const geminiAnalysis = await generateTailoredAnalysis(
      application.form_data,
      financialMetrics,
      loanProduct
    )

    // Save analysis report to database
    const { data: report, error: insertError } = await supabase
      .from('analysis_reports')
      .insert({
        application_id: applicationId,
        loan_product_id: loanProductId,
        overall_score: geminiAnalysis.overall_score,
        score_breakdown: geminiAnalysis.score_breakdown,
        key_factors: geminiAnalysis.key_factors,
        recommendations: geminiAnalysis.recommendations,
        approval_probability: geminiAnalysis.approval_probability,
        gemini_response: geminiAnalysis
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving report:', insertError)
      return NextResponse.json(
        { error: 'Failed to save analysis report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report,
      cached: false
    })

  } catch (error) {
    console.error('Error in generate-report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing analysis
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
    const loanProductId = searchParams.get('loanProductId')

    if (!applicationId || !loanProductId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Fetch analysis report
    const { data: report, error } = await supabase
      .from('analysis_reports')
      .select(`
        *,
        loan_products (
          bank_name,
          product_name,
          interest_rate_range
        )
      `)
      .eq('application_id', applicationId)
      .eq('loan_product_id', loanProductId)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Analysis report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
