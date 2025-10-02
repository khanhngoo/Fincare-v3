/**
 * Utility functions to compute financial metrics from parsed document data
 */

export interface FinancialMetrics {
  annual_revenue: number | null
  total_assets: number | null
  total_liabilities: number | null
  total_equity: number | null
  current_ratio: string | null
  debt_to_equity: string | null
  profit_margin: string | null
  opening_balance: number | null
  closing_balance: number | null
  total_debit: number | null
  total_credit: number | null
  extracted_data: any
}

/**
 * Compute financial metrics from parsed balance sheet and bank statement data
 */
export function computeMetricsFromParsedData(
  financialPerformance: any,
  bankStatements: any
): FinancialMetrics {
  const metrics: FinancialMetrics = {
    annual_revenue: null,
    total_assets: null,
    total_liabilities: null,
    total_equity: null,
    current_ratio: null,
    debt_to_equity: null,
    profit_margin: null,
    opening_balance: null,
    closing_balance: null,
    total_debit: null,
    total_credit: null,
    extracted_data: {}
  }

  // Process financial performance data (from balance sheet)
  if (financialPerformance && financialPerformance.assets) {
    // Calculate total assets
    metrics.total_assets = Object.values(financialPerformance.assets).reduce((sum: number, item: any) => {
      return sum + (Number(item.closing) || 0)
    }, 0)

    // Calculate total liabilities
    if (financialPerformance.liabilities) {
      metrics.total_liabilities = Object.values(financialPerformance.liabilities).reduce((sum: number, item: any) => {
        return sum + (Number(item.closing) || 0)
      }, 0)
    }

    // Calculate total equity
    if (financialPerformance.equity) {
      metrics.total_equity = Object.values(financialPerformance.equity).reduce((sum: number, item: any) => {
        return sum + (Number(item.closing) || 0)
      }, 0)
    }

    // Calculate ratios
    if (metrics.total_assets && metrics.total_liabilities) {
      metrics.current_ratio = (metrics.total_assets / metrics.total_liabilities).toFixed(2)
    }

    if (metrics.total_equity && metrics.total_liabilities && metrics.total_equity > 0) {
      metrics.debt_to_equity = (metrics.total_liabilities / metrics.total_equity).toFixed(2)
    }

    metrics.extracted_data.financial_performance = financialPerformance
  }

  // Process bank statement data
  if (bankStatements) {
    metrics.opening_balance = bankStatements.opening_balance
    metrics.closing_balance = bankStatements.closing_balance
    metrics.total_debit = bankStatements.total_debit
    metrics.total_credit = bankStatements.total_credit
    metrics.extracted_data.bank_statements = bankStatements
  }

  return metrics
}

/**
 * Load financial metrics from localStorage for a given application
 */
export function loadMetricsFromLocalStorage(applicationId: string): FinancialMetrics | null {
  if (typeof window === 'undefined') return null

  try {
    const financialPerfStr = localStorage.getItem(`financialPerf_${applicationId}`)
    const bankStatementsStr = localStorage.getItem(`bankStatements_${applicationId}`)

    if (!financialPerfStr && !bankStatementsStr) {
      return null
    }

    const financialPerf = financialPerfStr ? JSON.parse(financialPerfStr) : null
    const bankStatements = bankStatementsStr ? JSON.parse(bankStatementsStr) : null

    return computeMetricsFromParsedData(financialPerf, bankStatements)
  } catch (error) {
    console.error('Error loading metrics from localStorage:', error)
    return null
  }
}
