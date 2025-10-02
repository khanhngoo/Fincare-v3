import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Fetch all loan products
    const { data: loanProducts, error: productsError } = await supabase
      .from('loan_products')
      .select('*')
      .eq('product_type', 'business')

    if (productsError) {
      console.error('Error fetching loan products:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch loan products' },
        { status: 500 }
      )
    }

    // If applicationId is provided, fetch application details for better matching
    let application = null
    if (applicationId) {
      const { data: appData, error: appError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .single()

      if (!appError) {
        application = appData
      }
    }

    // Transform loan products to match the frontend format
    const formattedProducts = loanProducts.map((product: any) => {
      // Calculate an estimated score based on application if available
      let estimatedScore = 75 // Default score

      if (application) {
        const baseScore = application.baseline_score || 75
        const loanAmount = application.loan_amount
        const annualRevenue = application.annual_revenue
        const timeInBusiness = application.time_in_business
        const loanPurpose = application.loan_purpose

        // Start with baseline score
        let matchScore = baseScore

        // 1. REVENUE MATCH (35% weight, -10 to +5 points)
        const revenueMap: { [key: string]: number } = {
          'under-1b': 500000000,
          '1b-5b': 3000000000,
          '5b-10b': 7500000000,
          'over-10b': 15000000000
        }
        const estimatedRevenue = revenueMap[annualRevenue] || 1000000000
        const minRevenue = product.eligibility_criteria?.min_revenue || 0

        if (estimatedRevenue >= minRevenue * 3) {
          matchScore += 5 // Exceeds requirement significantly
        } else if (estimatedRevenue >= minRevenue * 1.5) {
          matchScore += 3 // Comfortably meets requirement
        } else if (estimatedRevenue >= minRevenue) {
          matchScore += 1 // Meets requirement
        } else {
          matchScore -= 10 // Below requirement
        }

        // 2. TIME IN BUSINESS MATCH (25% weight, -8 to +4 points)
        const timeMap: { [key: string]: number } = {
          'just-starting': 0,
          'less-1-year': 6,
          '1-3-years': 24,
          '3-plus-years': 48
        }
        const businessMonths = timeMap[timeInBusiness] || 12
        const minTimeMonths = parseInt(product.eligibility_criteria?.min_time_in_business) || 0

        if (businessMonths >= minTimeMonths * 2) {
          matchScore += 4 // Well established
        } else if (businessMonths >= minTimeMonths) {
          matchScore += 2 // Meets requirement
        } else if (businessMonths >= minTimeMonths * 0.5) {
          matchScore -= 2 // Close but below
        } else {
          matchScore -= 8 // Well below requirement
        }

        // 3. AMOUNT FIT (20% weight, -8 to +3 points)
        const amountPercentage = (loanAmount / product.max_amount) * 100

        if (loanAmount > product.max_amount) {
          matchScore -= 8 // Over limit
        } else if (loanAmount < product.min_amount) {
          matchScore -= 5 // Under minimum
        } else if (amountPercentage >= 20 && amountPercentage <= 60) {
          matchScore += 3 // Sweet spot
        } else if (amountPercentage > 80) {
          matchScore -= 2 // Too close to max
        }

        // 4. PURPOSE ALIGNMENT (20% weight, 0 to +3 points)
        const purposeBonus: { [key: string]: number } = {
          'working-capital': 2,
          'business-expansion': 3,
          'purchase-equipment': 2,
          'inventory': 2,
          'real-estate': 1
        }

        if (product.product_name.toLowerCase().includes('tech') &&
            (loanPurpose === 'purchase-equipment' || loanPurpose === 'business-expansion')) {
          matchScore += 3 // Tech loan + tech purpose
        } else if (product.product_name.toLowerCase().includes('export') &&
                   product.eligibility_criteria?.export_business) {
          matchScore += 3 // Export loan + export business
        } else {
          matchScore += purposeBonus[loanPurpose] || 0
        }

        // Ensure score stays within 0-100 range
        estimatedScore = Math.max(30, Math.min(100, Math.round(matchScore)))
      }

      return {
        id: String(product.id),
        bankName: product.bank_name,
        productName: product.product_name,
        interestRate: product.interest_rate_range,
        tenor: product.tenor_range,
        maxAmount: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(product.max_amount),
        estimatedScore,
        requiredDocs: product.required_docs,
        features: product.features
      }
    })

    // Sort by estimated score (highest first)
    formattedProducts.sort((a, b) => b.estimatedScore - a.estimatedScore)

    return NextResponse.json({
      success: true,
      loans: formattedProducts,
      totalCount: formattedProducts.length
    })

  } catch (error) {
    console.error('Error in loan options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
