import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const applicationId = formData.get('applicationId') as string
    const category = formData.get('category') as string

    if (!file || !applicationId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, applicationId, or category' },
        { status: 400 }
      )
    }

    // Validate file type (only CSV)
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      )
    }

    // Verify the application belongs to the user
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

    // Generate unique file path
    const timestamp = Date.now()
    const fileName = `${applicationId}/${category}/${timestamp}_${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        path: fileName,
        url: publicUrl,
        size: file.size,
        category
      }
    })

  } catch (error) {
    console.error('Error in document upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
