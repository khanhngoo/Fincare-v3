/**
 * Tests for /api/analysis/generate-report endpoint
 */

import { POST, GET } from '@/app/api/analysis/generate-report/route'
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
          single: jest.fn(() => {
            if (table === 'analysis_reports') {
              return {
                data: null,
                error: { code: 'PGRST116' } // Not found
              }
            }
            return {
              data: { id: 'test-id' },
              error: null
            }
          }),
          maybeSingle: jest.fn(() => ({
            data: {
              overall_score: 78,
              score_breakdown: {
                'Financial Health': { score: 85, impact: 'High' }
              },
              key_factors: {
                positive: ['Strong revenue'],
                negative: ['Short time in business']
              },
              recommendations: ['Consider improving cash flow'],
              approval_probability: 75
            },
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-report-id',
              overall_score: 78
            },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

// Mock Gemini AI
jest.mock('@/lib/gemini', () => ({
  generateTailoredAnalysis: jest.fn(() => Promise.resolve({
    overall_score: 78,
    score_breakdown: {
      'Financial Health': { score: 85, impact: 'High' },
      'Business Stability': { score: 75, impact: 'Medium' }
    },
    key_factors: {
      positive: ['Strong revenue growth', 'Good collateral'],
      negative: ['Short time in business', 'High debt ratio']
    },
    recommendations: [
      'Consider reducing debt-to-income ratio',
      'Build longer business history'
    ],
    approval_probability: 75
  }))
}))

describe('/api/analysis/generate-report POST', () => {
  it('should generate new analysis report', async () => {
    const requestBody = {
      applicationId: 'test-application-id',
      loanProductId: 'test-loan-product-id'
    }

    const request = new NextRequest('http://localhost:3000/api/analysis/generate-report', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.report).toBeDefined()
    expect(data.report.overall_score).toBe(78)
    expect(data.report.score_breakdown).toBeDefined()
    expect(data.report.key_factors).toBeDefined()
    expect(data.report.recommendations).toBeDefined()
  })

  it('should return 400 when missing required fields', async () => {
    const requestBody = {
      applicationId: 'test-application-id'
      // Missing loanProductId
    }

    const request = new NextRequest('http://localhost:3000/api/analysis/generate-report', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('should handle Gemini API errors', async () => {
    const { generateTailoredAnalysis } = require('@/lib/gemini')
    generateTailoredAnalysis.mockRejectedValueOnce(new Error('Gemini API error'))

    const requestBody = {
      applicationId: 'test-application-id',
      loanProductId: 'test-loan-product-id'
    }

    const request = new NextRequest('http://localhost:3000/api/analysis/generate-report', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})

describe('/api/analysis/generate-report GET', () => {
  it('should fetch existing analysis report', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analysis/generate-report?applicationId=test-app-id&loanProductId=test-product-id'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.report).toBeDefined()
    expect(data.report.overall_score).toBeDefined()
  })

  it('should return 404 when report not found', async () => {
    // Mock not found scenario
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn(() => ({
          data: { user: { id: 'test-user-id' } },
          error: null
        }))
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    }))

    const request = new NextRequest(
      'http://localhost:3000/api/analysis/generate-report?applicationId=test-app-id&loanProductId=test-product-id'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Analysis report not found')
  })

  it('should return 400 when missing query parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/analysis/generate-report')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required parameters')
  })
})
