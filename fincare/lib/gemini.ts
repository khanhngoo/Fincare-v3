import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Gemini Pro for complex analysis
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro'
})

// Gemini 2.5 Flash for fast baseline calculations
export const geminiFlashModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro'
})

// Helper function to calculate baseline score from loan form data
export async function calculateBaselineScore(formData: any) {
  const prompt = `You are a financial credit analyst. Calculate a realistic baseline creditworthiness score from 0-100 for this business loan application.

Loan Request:
- Loan Amount: ${formData.loanAmount} VND
- Loan Purpose: ${formData.loanPurpose}

Business Overview:
- Annual Revenue Range: ${formData.annualRevenue}
- Time in Business: ${formData.timeInBusiness}

Scoring Guidelines (use these ranges):

REVENUE IMPACT (40% weight):
- "over-10b": 85-95 points (excellent revenue, very strong)
- "5b-10b": 70-80 points (strong revenue)
- "1b-5b": 55-70 points (moderate revenue)
- "under-1b": 45-60 points (limited revenue)

TIME IN BUSINESS IMPACT (30% weight):
- "3-plus-years": +15 points (established business)
- "1-3-years": +8 points (growing business)
- "less-1-year": +3 points (new business)
- "just-starting": +0 points (startup)

LOAN PURPOSE IMPACT (20% weight):
- "working-capital" or "business-expansion": +5 points (growth-oriented)
- "purchase-equipment" or "inventory": +3 points (operational)
- "start-new-business": -5 points (higher risk)
- Other: +0 points

AMOUNT/REVENUE RATIO (10% weight):
- Loan < 50% of revenue: +5 points (very manageable)
- Loan 50-100% of revenue: +0 points (manageable)
- Loan > 100% of revenue: -5 points (stretching)

Calculate the final score by combining these factors. Strong businesses with over 10B revenue and 3+ years should score 75-90. New businesses under 1B should score 45-65.

Format your response as JSON:
{
  "score": <number 0-100>,
  "reasoning": "<brief 2-3 sentence explanation>"
}`

  const result = await geminiFlashModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse Gemini response')
}

// Helper function to generate tailored analysis for a specific loan product
export async function generateTailoredAnalysis(
  formData: any,
  financialMetrics: any,
  loanProduct: any
) {
  const prompt = `You are a financial credit analyst. Analyze this business loan application specifically for the "${loanProduct.product_name}" from ${loanProduct.bank_name}.

Application Details:
- Business Name: ${formData.businessName}
- Loan Amount: ${formData.loanAmount}
- Loan Purpose: ${formData.loanPurpose}

Extracted Financial Metrics:
- Annual Revenue: ${financialMetrics.annual_revenue}
- Total Assets: ${financialMetrics.total_assets}
- Total Liabilities: ${financialMetrics.total_liabilities}
- Current Ratio: ${financialMetrics.current_ratio}
- Debt-to-Equity Ratio: ${financialMetrics.debt_to_equity}
- Profit Margin: ${financialMetrics.profit_margin}%

Loan Product Requirements:
- Interest Rate Range: ${loanProduct.interest_rate_range}
- Max Amount: ${loanProduct.max_amount}
- Tenor Range: ${loanProduct.tenor_range}
- Eligibility Criteria: ${JSON.stringify(loanProduct.eligibility_criteria)}

Please provide a comprehensive analysis in the following JSON format:
{
  "overall_score": <number 0-100>,
  "score_breakdown": {
    "Financial Health": {"score": <0-100>, "impact": <"High"|"Medium"|"Low">},
    "Business Stability": {"score": <0-100>, "impact": <"High"|"Medium"|"Low">},
    "Debt Management": {"score": <0-100>, "impact": <"High"|"Medium"|"Low">},
    "Loan Affordability": {"score": <0-100>, "impact": <"High"|"Medium"|"Low">},
    "Collateral Adequacy": {"score": <0-100>, "impact": <"High"|"Medium"|"Low">}
  },
  "key_factors": {
    "positive": ["<factor 1>", "<factor 2>", ...],
    "negative": ["<factor 1>", "<factor 2>", ...]
  },
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "approval_probability": <percentage 0-100>
}`

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse Gemini response')
}

// Helper function to generate comprehensive detailed report
export async function generateDetailedReport(
  application: any,
  loanProduct: any,
  financialMetrics: any | null
) {
  const prompt = `You are a senior financial analyst. Generate a comprehensive loan analysis report for this business loan application.

APPLICATION DETAILS:
- Business Name: ${application.business_name}
- Loan Amount Requested: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(application.loan_amount)}
- Loan Purpose: ${application.loan_purpose}
- Annual Revenue Range: ${application.annual_revenue}
- Time in Business: ${application.time_in_business}
- Baseline Creditworthiness Score: ${application.baseline_score}/100

LOAN PRODUCT:
- Bank: ${loanProduct.bank_name}
- Product Name: ${loanProduct.product_name}
- Interest Rate Range: ${loanProduct.interest_rate_range}
- Maximum Amount: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(loanProduct.max_amount)}
- Tenor Range: ${loanProduct.tenor_range}
- Eligibility Criteria: ${JSON.stringify(loanProduct.eligibility_criteria)}

${financialMetrics ? `FINANCIAL METRICS:
- Annual Revenue: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(financialMetrics.annual_revenue)}
- Total Assets: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(financialMetrics.total_assets)}
- Total Liabilities: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(financialMetrics.total_liabilities)}
- Current Ratio: ${financialMetrics.current_ratio}
- Debt-to-Equity Ratio: ${financialMetrics.debt_to_equity}
- Profit Margin: ${financialMetrics.profit_margin}%` : 'FINANCIAL METRICS: Not yet provided - analysis based on stated revenue range'}

Please provide a detailed analysis with these sections. Use clear headings and bullet points:

## 1. EXECUTIVE SUMMARY
Provide a 2-3 paragraph overview of the loan application, key strengths and concerns, and overall recommendation.

## 2. FINANCIAL HEALTH ASSESSMENT
- Revenue Analysis: Evaluate the revenue range and sustainability
- Asset Evaluation: ${financialMetrics ? 'Analyze the asset base and composition' : 'Note that detailed assets will be provided with financial documents'}
- Liability Assessment: ${financialMetrics ? 'Review debt levels and obligations' : 'Will be assessed upon document submission'}
- Liquidity Analysis: ${financialMetrics ? 'Evaluate current ratio and working capital' : 'To be determined from financial statements'}
- Profitability Analysis: ${financialMetrics ? 'Assess profit margin and sustainability' : 'Pending financial document review'}

## 3. BUSINESS STABILITY EVALUATION
- Time in Business Impact: Analyze how the ${application.time_in_business} timeframe affects creditworthiness
- Industry Considerations: General considerations for this business type
- Growth Potential: Assessment of business trajectory

## 4. LOAN PRODUCT FIT ANALYSIS
- Eligibility Match: How well does this application meet the ${loanProduct.product_name} requirements?
- Interest Rate Competitiveness: Is the ${loanProduct.interest_rate_range} range favorable?
- Tenor Suitability: Is the ${loanProduct.tenor_range} appropriate for the loan purpose?
- Amount Appropriateness: Is the requested amount suitable given the maximum of ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(loanProduct.max_amount)}?

## 5. RISK ASSESSMENT
- Primary Risk Factors: List 3-5 key risks
- Mitigation Strategies: Specific actions to reduce risk
- Red Flags: Any serious concerns (if applicable)
- Strengths: Positive factors supporting approval

## 6. DETAILED RECOMMENDATIONS
- Specific Actions: What should the applicant do to improve approval chances?
- Documentation Suggestions: What additional documents would strengthen the application?
- Timeline Recommendations: Suggested next steps and timing
- Alternative Options: Other loan products to consider (if applicable)

## 7. APPROVAL PROBABILITY BREAKDOWN
- Likelihood Percentage: Estimated approval probability (0-100%)
- Factors Supporting Approval: List 3-5 positive factors
- Factors Against Approval: List potential obstacles
- Next Steps: Clear action items for the applicant

Use professional financial language but keep it understandable. Be specific and actionable in all recommendations.`

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  return text
}
