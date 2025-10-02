/**
 * Tests for /api/documents/save-data endpoint
 */

import { POST, GET } from '@/app/api/documents/save-data/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-application-id', user_id: 'test-user-id' },
            error: null
          })),
          maybeSingle: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-doc-id',
              application_id: 'test-application-id',
              category: 'business-identity',
              data: { registration_number: '123456' }
            },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('/api/documents/save-data POST', () => {
  it('should save business identity data', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      category: 'business-identity',
      data: {
        registration_number: '0123456789',
        tax_code: '0987654321',
        legal_name: 'ABC Company Ltd'
      },
      source: 'manual'
    }

    const request = new NextRequest('http://localhost:3000/api/documents/save-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.documentData).toBeDefined()
  })

  it('should save financial performance data', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      category: 'financial-performance',
      data: {
        assets: {
          cash_and_equivalents: { opening: '100000', closing: '150000' },
          financial_investments: { opening: '50000', closing: '60000' }
        },
        liabilities: {
          short_term_debt: { opening: '20000', closing: '25000' }
        },
        equity: {
          common_stock: { opening: '80000', closing: '90000' }
        }
      },
      source: 'manual'
    }

    const request = new NextRequest('http://localhost:3000/api/documents/save-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should save bank statements data', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      category: 'bank-statements',
      data: {
        opening_balance: '500000000',
        closing_balance: '750000000',
        total_debit: '2000000000',
        total_credit: '2250000000'
      },
      source: 'manual'
    }

    const request = new NextRequest('http://localhost:3000/api/documents/save-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 400 for invalid category', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      category: 'invalid-category',
      data: {},
      source: 'manual'
    }

    const request = new NextRequest('http://localhost:3000/api/documents/save-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid category')
  })

  it('should return 400 when missing required fields', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      // Missing category, data, source
    }

    const request = new NextRequest('http://localhost:3000/api/documents/save-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })
})

describe('/api/documents/save-data GET', () => {
  it('should fetch all documents for an application', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents/save-data?applicationId=test-app-id')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.documents).toBeDefined()
  })

  it('should return 400 when applicationId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents/save-data')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing applicationId parameter')
  })

  it('should filter by category when provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents/save-data?applicationId=test-app-id&category=business-identity')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
