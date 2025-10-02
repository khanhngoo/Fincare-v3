/**
 * Balance Sheet CSV Parser
 * Parses Vietnamese balance sheet CSV files and maps to financial performance form
 */

import Papa from 'papaparse'

interface BalanceSheetRow {
  Item: string
  Code: string
  NoteRef: string
  'Current Year': string
  'Prior Year': string
}

interface FinancialPerformanceData {
  assets: {
    cash_and_equivalents: { opening: string; closing: string }
    financial_investments: { opening: string; closing: string }
    short_term_loans: { opening: string; closing: string }
    accounts_receivable: { opening: string; closing: string }
    inventories: { opening: string; closing: string }
    fixed_assets: { opening: string; closing: string }
  }
  liabilities: {
    short_term_debt: { opening: string; closing: string }
    long_term_debt: { opening: string; closing: string }
    accounts_payable: { opening: string; closing: string }
    other_liabilities: { opening: string; closing: string }
  }
  equity: {
    common_stock: { opening: string; closing: string }
    retained_earnings: { opening: string; closing: string }
    other_reserves: { opening: string; closing: string }
  }
}

/**
 * Parse balance sheet CSV file and extract financial performance data
 * @param csvContent - Raw CSV file content as string
 * @returns Parsed financial performance data
 */
export function parseBalanceSheet(csvContent: string): FinancialPerformanceData {
  const parseResult = Papa.parse<BalanceSheetRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  const rows = parseResult.data
  const data: FinancialPerformanceData = {
    assets: {
      cash_and_equivalents: { opening: '', closing: '' },
      financial_investments: { opening: '', closing: '' },
      short_term_loans: { opening: '', closing: '' },
      accounts_receivable: { opening: '', closing: '' },
      inventories: { opening: '', closing: '' },
      fixed_assets: { opening: '', closing: '' }
    },
    liabilities: {
      short_term_debt: { opening: '', closing: '' },
      long_term_debt: { opening: '', closing: '' },
      accounts_payable: { opening: '', closing: '' },
      other_liabilities: { opening: '', closing: '' }
    },
    equity: {
      common_stock: { opening: '', closing: '' },
      retained_earnings: { opening: '', closing: '' },
      other_reserves: { opening: '', closing: '' }
    }
  }

  // Helper to find row by item name or code
  const findRow = (itemName: string, code?: string): BalanceSheetRow | undefined => {
    return rows.find(row => {
      const item = row.Item?.trim()
      const rowCode = row.Code?.trim()

      // Match by code if provided
      if (code && rowCode === code) return true

      // Match by item name (case-insensitive, partial match)
      if (item && item.toLowerCase().includes(itemName.toLowerCase())) return true

      return false
    })
  }

  // Helper to extract values from row
  const extractValues = (row: BalanceSheetRow | undefined) => {
    if (!row) return { opening: '', closing: '' }

    const priorYear = row['Prior Year']?.replace(/,/g, '') || ''
    const currentYear = row['Current Year']?.replace(/,/g, '') || ''

    return {
      opening: priorYear,
      closing: currentYear
    }
  }

  // ASSETS MAPPING

  // Cash and cash equivalents
  const cashRow = findRow('Cash and cash equivalents', '110')
  data.assets.cash_and_equivalents = extractValues(cashRow)

  // Financial investments
  const investmentsRow = findRow('Financial investments', '120')
  data.assets.financial_investments = extractValues(investmentsRow)

  // Short-term loans and advances (from Advances to suppliers)
  const advancesRow = findRow('Advances to suppliers', '132')
  data.assets.short_term_loans = extractValues(advancesRow)

  // Accounts receivable (from Trade receivables)
  const receivablesRow = findRow('Trade receivables', '131')
  data.assets.accounts_receivable = extractValues(receivablesRow)

  // Inventories
  const inventoriesRow = findRow('Inventories', '140')
  data.assets.inventories = extractValues(inventoriesRow)

  // Fixed assets (net)
  const fixedAssetsRow = findRow('Fixed assets (net)', '150')
  data.assets.fixed_assets = extractValues(fixedAssetsRow)

  // LIABILITIES MAPPING

  // Short-term debt (approximated from total borrowings * 0.6)
  const borrowingsRow = findRow('Borrowings and finance lease liabilities', '316')
  if (borrowingsRow) {
    const opening = borrowingsRow['Prior Year']?.replace(/,/g, '') || '0'
    const closing = borrowingsRow['Current Year']?.replace(/,/g, '') || '0'

    // Estimate 60% is short-term, 40% is long-term
    data.liabilities.short_term_debt = {
      opening: String(Math.round(Number(opening) * 0.6)),
      closing: String(Math.round(Number(closing) * 0.6))
    }

    data.liabilities.long_term_debt = {
      opening: String(Math.round(Number(opening) * 0.4)),
      closing: String(Math.round(Number(closing) * 0.4))
    }
  }

  // Accounts payable (from Trade payables)
  const payablesRow = findRow('Trade payables', '311')
  data.liabilities.accounts_payable = extractValues(payablesRow)

  // Other liabilities (sum of other payable items)
  const otherPayablesRow = findRow('Other payables', '315')
  const taxesPayableRow = findRow('Taxes and statutory obligations payable', '313')
  const employeePayableRow = findRow('Payables to employees', '314')

  if (otherPayablesRow || taxesPayableRow || employeePayableRow) {
    const opening =
      Number(otherPayablesRow?.['Prior Year']?.replace(/,/g, '') || 0) +
      Number(taxesPayableRow?.['Prior Year']?.replace(/,/g, '') || 0) +
      Number(employeePayableRow?.['Prior Year']?.replace(/,/g, '') || 0)

    const closing =
      Number(otherPayablesRow?.['Current Year']?.replace(/,/g, '') || 0) +
      Number(taxesPayableRow?.['Current Year']?.replace(/,/g, '') || 0) +
      Number(employeePayableRow?.['Current Year']?.replace(/,/g, '') || 0)

    data.liabilities.other_liabilities = {
      opening: String(opening),
      closing: String(closing)
    }
  }

  // EQUITY MAPPING

  // Common stock (from Owner's charter capital)
  const capitalRow = findRow("Owner's (charter) capital", '411')
  data.equity.common_stock = extractValues(capitalRow)

  // Retained earnings
  const retainedEarningsRow = findRow('Retained earnings after tax', '417')
  data.equity.retained_earnings = extractValues(retainedEarningsRow)

  // Other reserves (sum of reserves and other funds)
  const reservesRow = findRow('Reserves and other funds', '416')
  const sharePremiumRow = findRow('Share premium', '412')
  const fxDiffRow = findRow('Foreign exchange differences', '415')

  if (reservesRow || sharePremiumRow || fxDiffRow) {
    const opening =
      Number(reservesRow?.['Prior Year']?.replace(/,/g, '') || 0) +
      Number(sharePremiumRow?.['Prior Year']?.replace(/,/g, '') || 0) +
      Number(fxDiffRow?.['Prior Year']?.replace(/,/g, '') || 0)

    const closing =
      Number(reservesRow?.['Current Year']?.replace(/,/g, '') || 0) +
      Number(sharePremiumRow?.['Current Year']?.replace(/,/g, '') || 0) +
      Number(fxDiffRow?.['Current Year']?.replace(/,/g, '') || 0)

    data.equity.other_reserves = {
      opening: String(opening),
      closing: String(closing)
    }
  }

  return data
}

/**
 * Parse balance sheet file and return formatted data
 * @param file - File object from file input
 * @returns Promise with parsed financial performance data
 */
export async function parseBalanceSheetFile(file: File): Promise<FinancialPerformanceData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string
        const data = parseBalanceSheet(csvContent)
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse balance sheet CSV: ' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Validate parsed balance sheet data
 * @param data - Parsed financial performance data
 * @returns Validation result with any errors
 */
export function validateBalanceSheetData(data: FinancialPerformanceData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if key fields are populated
  const requiredFields = [
    { path: 'assets.cash_and_equivalents', label: 'Cash and cash equivalents' },
    { path: 'assets.inventories', label: 'Inventories' },
    { path: 'assets.fixed_assets', label: 'Fixed assets' },
    { path: 'liabilities.accounts_payable', label: 'Accounts payable' },
    { path: 'equity.common_stock', label: 'Common stock' }
  ]

  requiredFields.forEach(field => {
    const keys = field.path.split('.')
    let value: any = data

    for (const key of keys) {
      value = value?.[key]
    }

    if (!value?.opening && !value?.closing) {
      errors.push(`Missing ${field.label} data`)
    }
  })

  // Validate balance sheet equation: Assets = Liabilities + Equity
  const totalAssets = calculateTotal(data.assets)
  const totalLiabilities = calculateTotal(data.liabilities)
  const totalEquity = calculateTotal(data.equity)

  const closingBalance = totalAssets.closing - (totalLiabilities.closing + totalEquity.closing)
  const openingBalance = totalAssets.opening - (totalLiabilities.opening + totalEquity.opening)

  // Allow 1% tolerance for rounding
  const closingTolerance = Math.abs(closingBalance) / (totalAssets.closing || 1)
  const openingTolerance = Math.abs(openingBalance) / (totalAssets.opening || 1)

  if (closingTolerance > 0.01) {
    errors.push('Balance sheet does not balance for current year (Assets ≠ Liabilities + Equity)')
  }

  if (openingTolerance > 0.01) {
    errors.push('Balance sheet does not balance for prior year (Assets ≠ Liabilities + Equity)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate total from a section (assets, liabilities, or equity)
 */
function calculateTotal(section: Record<string, { opening: string; closing: string }>) {
  let opening = 0
  let closing = 0

  Object.values(section).forEach(item => {
    opening += Number(item.opening) || 0
    closing += Number(item.closing) || 0
  })

  return { opening, closing }
}
