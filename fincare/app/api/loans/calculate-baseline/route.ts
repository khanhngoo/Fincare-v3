import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateBaselineScore } from '@/lib/scoring'

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

    // Get form data from request
    const formData = await request.json()

    // Validate required fields (simplified to match loan form)
    const requiredFields = [
      'loanAmount',
      'loanPurpose',
      'annualRevenue',
      'timeInBusiness'
    ]

    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Calculate baseline score using local algorithm
    const scoreResult = await calculateBaselineScore(formData)

    // Save loan application to Supabase (business details will be filled from documents page)
    const { data: application, error: insertError } = await supabase
      .from('loan_applications')
      .insert({
        user_id: user.id,
        business_name: formData.businessName || 'To be provided',
        registration_number: formData.registrationNumber || 'TBD',
        tax_code: formData.taxCode || 'TBD',
        loan_amount: formData.loanAmount,
        loan_purpose: formData.loanPurpose,
        annual_revenue: formData.annualRevenue,
        time_in_business: formData.timeInBusiness,
        baseline_score: scoreResult.score,
        baseline_reasoning: scoreResult.reasoning,
        form_data: formData
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting application:', insertError)
      return NextResponse.json(
        { error: 'Failed to save application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application,
      baselineScore: scoreResult.score,
      reasoning: scoreResult.reasoning
    })

  } catch (error) {
    console.error('Error in calculate-baseline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
