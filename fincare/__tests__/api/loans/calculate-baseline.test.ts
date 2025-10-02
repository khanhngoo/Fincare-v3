/**
 * Tests for /api/loans/calculate-baseline endpoint
 *
 * To run these tests:
 * 1. Install test dependencies: npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest
 * 2. Create jest.config.js in project root
 * 3. Add test script to package.json: "test": "jest"
 * 4. Run: npm test
 */

import { POST } from '@/app/api/loans/calculate-baseline/route'
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
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-application-id',
              user_id: 'test-user-id',
              loan_amount: 50000000,
              baseline_score: 75
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
  calculateBaselineScore: jest.fn(() => Promise.resolve({
    score: 75,
    reasoning: 'Good creditworthiness based on revenue and time in business'
  }))
}))

describe('/api/loans/calculate-baseline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully calculate baseline score with valid data', async () => {
    const requestBody = {
      loanAmount: 50000000,
      loanPurpose: 'working-capital',
      annualRevenue: '1b-5b',
      timeInBusiness: '1-3-years'
    }

    const request = new NextRequest('http://localhost:3000/api/loans/calculate-baseline', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.application).toBeDefined()
    expect(data.application.baseline_score).toBe(75)
    expect(data.baseline).toBeDefined()
    expect(data.baseline.score).toBe(75)
  })

  it('should return 400 when missing required fields', async () => {
    const requestBody = {
      loanAmount: 50000000,
      // Missing loanPurpose, annualRevenue, timeInBusiness
    }

    const request = new NextRequest('http://localhost:3000/api/loans/calculate-baseline', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('should validate loan amount is a positive number', async () => {
    const requestBody = {
      loanAmount: -50000,
      loanPurpose: 'working-capital',
      annualRevenue: '1b-5b',
      timeInBusiness: '1-3-years'
    }

    const request = new NextRequest('http://localhost:3000/api/loans/calculate-baseline', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Loan amount must be a positive number')
  })

  it('should handle unauthorized requests', async () => {
    // Mock unauthorized user
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockImplementationOnce(() => ({
      auth: {
        getUser: jest.fn(() => ({
          data: { user: null },
          error: { message: 'Unauthorized' }
        }))
      }
    }))

    const requestBody = {
      loanAmount: 50000000,
      loanPurpose: 'working-capital',
      annualRevenue: '1b-5b',
      timeInBusiness: '1-3-years'
    }

    const request = new NextRequest('http://localhost:3000/api/loans/calculate-baseline', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should handle Gemini API errors gracefully', async () => {
    const { calculateBaselineScore } = require('@/lib/gemini')
    calculateBaselineScore.mockRejectedValueOnce(new Error('Gemini API error'))

    const requestBody = {
      loanAmount: 50000000,
      loanPurpose: 'working-capital',
      annualRevenue: '1b-5b',
      timeInBusiness: '1-3-years'
    }

    const request = new NextRequest('http://localhost:3000/api/loans/calculate-baseline', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})
