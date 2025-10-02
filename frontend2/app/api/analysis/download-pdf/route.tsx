import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDetailedReport } from '@/lib/gemini'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFReportTemplate } from '@/components/analysis/pdf-report-template'
import React from 'react'

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

    // Fetch loan product
    let loanProduct
    if (loanProductId) {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanProductId)
        .single()

      if (!error) loanProduct = data
    }

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

    // Generate AI report text
    const reportText = await generateDetailedReport(
      application,
      loanProduct,
      financialMetrics
    )

    // Format data for PDF
    const pdfData = {
      businessName: application.business_name,
      loanAmount: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(application.loan_amount),
      bankName: loanProduct.bank_name,
      productName: loanProduct.product_name,
      baselineScore: application.baseline_score,
      reportText,
      generatedDate: new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <PDFReportTemplate data={pdfData} />
    )

    // Create filename
    const filename = `FinCare_Analysis_${application.business_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

    // Convert Buffer to Uint8Array for NextResponse
    const pdfBytes = new Uint8Array(pdfBuffer)

    // Return PDF as download
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
