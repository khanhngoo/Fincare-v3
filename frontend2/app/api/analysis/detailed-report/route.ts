import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDetailedReport } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

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

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Missing applicationId parameter' },
        { status: 400 }
      )
    }

    // Fetch application
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

    // Fetch loan product (use first from options if not specified)
    let loanProduct
    if (loanProductId) {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanProductId)
        .single()

      if (!error) loanProduct = data
    }

    // If no specific product, get the best matching one
    if (!loanProduct) {
      const { data } = await supabase
        .from('loan_products')
        .select('*')
        .eq('product_type', 'business')
        .limit(1)

      if (data && data.length > 0) {
        loanProduct = data[0]
      }
    }

    if (!loanProduct) {
      return NextResponse.json(
        { error: 'No loan product found' },
        { status: 404 }
      )
    }

    // Fetch financial metrics if available
    const { data: financialMetrics } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('application_id', applicationId)
      .single()

    // Generate AI report
    const reportText = await generateDetailedReport(
      application,
      loanProduct,
      financialMetrics
    )

    return NextResponse.json({
      success: true,
      report: reportText,
      application: {
        id: application.id,
        businessName: application.business_name,
        loanAmount: application.loan_amount,
        baselineScore: application.baseline_score
      },
      loanProduct: {
        id: loanProduct.id,
        bankName: loanProduct.bank_name,
        productName: loanProduct.product_name
      }
    })

  } catch (error: any) {
    console.error('Error generating detailed report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}
