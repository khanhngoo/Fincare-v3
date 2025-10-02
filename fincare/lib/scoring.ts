/**
 * Local baseline creditworthiness scoring algorithm
 * Replaces Gemini AI calculation for instant, deterministic results
 */

interface LoanFormData {
  loanAmount: number
  loanPurpose: string
  annualRevenue: string
  timeInBusiness: string
}

interface ScoreResult {
  score: number
  reasoning: string
}

/**
 * Calculate baseline creditworthiness score (0-100)
 *
 * Algorithm weights:
 * - Revenue: 40%
 * - Time in Business: 30%
 * - Loan Purpose: 20%
 * - Amount/Revenue Ratio: 10%
 */
export function calculateBaselineScore(formData: LoanFormData): ScoreResult {
  // 1. REVENUE SCORING (40% weight)
  const revenueScores: { [key: string]: number } = {
    'under-1b': 50,
    '1b-5b': 65,
    '5b-10b': 78,
    'over-10b': 90
  }
  const revenueScore = revenueScores[formData.annualRevenue] || 60

  // 2. TIME IN BUSINESS SCORING (30% weight)
  const timeScores: { [key: string]: number } = {
    'just-starting': 45,
    'less-1-year': 58,
    '1-3-years': 72,
    '3-plus-years': 85
  }
  const timeScore = timeScores[formData.timeInBusiness] || 60

  // 3. LOAN PURPOSE SCORING (20% weight)
  const purposeAdjustments: { [key: string]: number } = {
    'working-capital': 10,
    'purchase-equipment': 8,
    'business-expansion': 12,
    'inventory': 7,
    'real-estate': 6,
    'debt-consolidation': 4,
    'start-new-business': -10
  }
  const purposeBonus = purposeAdjustments[formData.loanPurpose] || 0
  const purposeScore = 65 + purposeBonus

  // 4. AMOUNT/REVENUE RATIO SCORING (10% weight)
  // Estimate actual revenue from range
  const revenueEstimates: { [key: string]: number } = {
    'under-1b': 500_000_000,
    '1b-5b': 3_000_000_000,
    '5b-10b': 7_500_000_000,
    'over-10b': 15_000_000_000
  }
  const estimatedRevenue = revenueEstimates[formData.annualRevenue] || 1_000_000_000
  const loanToRevenueRatio = formData.loanAmount / estimatedRevenue

  let ratioScore = 65
  if (loanToRevenueRatio < 0.5) {
    ratioScore = 70 // Very manageable
  } else if (loanToRevenueRatio <= 1.0) {
    ratioScore = 65 // Manageable
  } else {
    ratioScore = 57 // Stretching
  }

  // 5. CALCULATE WEIGHTED FINAL SCORE
  const finalScore = Math.round(
    (revenueScore * 0.4) +
    (timeScore * 0.3) +
    (purposeScore * 0.2) +
    (ratioScore * 0.1)
  )

  // Ensure score is within 40-95 range
  const clampedScore = Math.max(40, Math.min(95, finalScore))

  // 6. GENERATE REASONING
  const reasoning = generateReasoning(formData, clampedScore, {
    revenueScore,
    timeScore,
    purposeScore,
    ratioScore,
    loanToRevenueRatio
  })

  return {
    score: clampedScore,
    reasoning
  }
}

function generateReasoning(
  formData: LoanFormData,
  finalScore: number,
  breakdown: {
    revenueScore: number
    timeScore: number
    purposeScore: number
    ratioScore: number
    loanToRevenueRatio: number
  }
): string {
  const parts: string[] = []

  // Revenue assessment
  if (breakdown.revenueScore >= 85) {
    parts.push("Excellent revenue demonstrates strong business performance")
  } else if (breakdown.revenueScore >= 70) {
    parts.push("Strong revenue indicates solid business foundation")
  } else if (breakdown.revenueScore >= 60) {
    parts.push("Moderate revenue suggests growing business")
  } else {
    parts.push("Limited revenue indicates early-stage business")
  }

  // Time in business assessment
  if (breakdown.timeScore >= 80) {
    parts.push("well-established operational history")
  } else if (breakdown.timeScore >= 70) {
    parts.push("proven track record")
  } else if (breakdown.timeScore >= 60) {
    parts.push("developing business experience")
  } else {
    parts.push("limited operational history")
  }

  // Loan purpose and ratio assessment
  if (breakdown.loanToRevenueRatio < 0.5) {
    parts.push(`The requested ${formatCurrency(formData.loanAmount)} is very manageable relative to revenue.`)
  } else if (breakdown.loanToRevenueRatio <= 1.0) {
    parts.push(`The requested ${formatCurrency(formData.loanAmount)} is reasonable for the business size.`)
  } else {
    parts.push(`The requested ${formatCurrency(formData.loanAmount)} is significant relative to current revenue.`)
  }

  return parts.join(", ") + " " + getScoreInterpretation(finalScore)
}

function getScoreInterpretation(score: number): string {
  if (score >= 85) {
    return "This profile indicates very strong creditworthiness with excellent approval prospects."
  } else if (score >= 75) {
    return "This profile shows strong creditworthiness with good approval potential."
  } else if (score >= 65) {
    return "This profile demonstrates moderate creditworthiness with fair approval chances."
  } else if (score >= 55) {
    return "This profile suggests developing creditworthiness that may require additional documentation."
  } else {
    return "This profile indicates early-stage business that may face challenges in traditional lending."
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
