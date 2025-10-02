/**
 * Bank Statement CSV Parser
 * Parses bank statement CSV files and extracts key financial metrics
 */

import Papa from 'papaparse'

interface BankStatementRow {
  'Transaction date': string
  'Remitter': string
  'Remitter bank': string
  'Details': string
  'Transaction No.': string
  'Debit': string
  'Credit': string
  'Fee/Interest': string
  'Tax': string
  'Balance': string
}

interface BankStatementData {
  opening_balance: string
  closing_balance: string
  total_debit: string
  total_credit: string
  transaction_count?: number
  start_date?: string
  end_date?: string
}

/**
 * Parse bank statement CSV file and extract summary metrics
 * @param csvContent - Raw CSV file content as string
 * @returns Parsed bank statement data
 */
export function parseBankStatement(csvContent: string): BankStatementData {
  const parseResult = Papa.parse<BankStatementRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  const rows = parseResult.data

  let openingBalance = '0'
  let closingBalance = '0'
  let totalDebit = 0
  let totalCredit = 0
  let transactionCount = 0
  let startDate = ''
  let endDate = ''

  // Process each row
  rows.forEach((row, index) => {
    const details = row.Details?.toLowerCase() || ''
    const remitter = row.Remitter?.toLowerCase() || ''
    const debit = parseFloat(row.Debit?.replace(/,/g, '') || '0')
    const credit = parseFloat(row.Credit?.replace(/,/g, '') || '0')
    const balance = row.Balance?.replace(/,/g, '') || '0'
    const transactionDate = row['Transaction date']

    // Check for opening balance (first transaction or explicit opening balance row)
    if (index === 0 || details.includes('opening balance') || remitter.includes('opening')) {
      openingBalance = balance
      if (transactionDate && !startDate) {
        startDate = transactionDate
      }
    }

    // Check for closing/ending balance (last transaction or explicit closing balance row)
    if (details.includes('ending balance') || details.includes('closing balance') ||
        remitter.includes('ending') || remitter.includes('closing')) {
      closingBalance = balance
      if (transactionDate) {
        endDate = transactionDate
      }
    }

    // Sum debits and credits (exclude opening/closing balance rows)
    if (!details.includes('opening balance') &&
        !details.includes('ending balance') &&
        !details.includes('closing balance') &&
        !remitter.includes('opening') &&
        !remitter.includes('ending') &&
        !remitter.includes('closing')) {

      if (debit > 0) {
        totalDebit += debit
        transactionCount++
      }

      if (credit > 0) {
        totalCredit += credit
        transactionCount++
      }

      // Update end date to last transaction date
      if (transactionDate) {
        endDate = transactionDate
      }
    }
  })

  // If closing balance wasn't explicitly found, use the last row's balance
  if (closingBalance === '0' && rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    closingBalance = lastRow.Balance?.replace(/,/g, '') || '0'
  }

  return {
    opening_balance: openingBalance,
    closing_balance: closingBalance,
    total_debit: Math.round(totalDebit).toString(),
    total_credit: Math.round(totalCredit).toString(),
    transaction_count: transactionCount,
    start_date: startDate,
    end_date: endDate
  }
}

/**
 * Parse bank statement file and return formatted data
 * @param file - File object from file input
 * @returns Promise with parsed bank statement data
 */
export async function parseBankStatementFile(file: File): Promise<BankStatementData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string
        const data = parseBankStatement(csvContent)
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse bank statement CSV: ' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Validate parsed bank statement data
 * @param data - Parsed bank statement data
 * @returns Validation result with any errors
 */
export function validateBankStatementData(data: BankStatementData): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required fields
  if (!data.opening_balance || data.opening_balance === '0') {
    errors.push('Opening balance not found or is zero')
  }

  if (!data.closing_balance || data.closing_balance === '0') {
    errors.push('Closing balance not found or is zero')
  }

  if (!data.total_debit || data.total_debit === '0') {
    warnings.push('No debit transactions found')
  }

  if (!data.total_credit || data.total_credit === '0') {
    warnings.push('No credit transactions found')
  }

  // Validate balance equation: Closing = Opening + Credits - Debits
  const opening = parseFloat(data.opening_balance || '0')
  const closing = parseFloat(data.closing_balance || '0')
  const totalDebit = parseFloat(data.total_debit || '0')
  const totalCredit = parseFloat(data.total_credit || '0')

  const calculatedClosing = opening + totalCredit - totalDebit
  const difference = Math.abs(closing - calculatedClosing)

  // Allow 1% tolerance or 100,000 VND difference (whichever is larger)
  const tolerance = Math.max(closing * 0.01, 100000)

  if (difference > tolerance) {
    warnings.push(
      `Balance verification warning: Closing balance (${formatVND(closing)}) doesn't match ` +
      `calculated balance (${formatVND(calculatedClosing)}). ` +
      `Difference: ${formatVND(difference)}`
    )
  }

  // Check transaction count
  if (data.transaction_count === 0) {
    warnings.push('No transactions found (excluding opening/closing balance rows)')
  }

  // Check date range
  if (!data.start_date || !data.end_date) {
    warnings.push('Could not determine statement date range')
  } else if (data.start_date === data.end_date) {
    warnings.push('Statement appears to cover only one day')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get detailed transaction analysis
 * @param csvContent - Raw CSV file content
 * @returns Detailed analysis of transactions
 */
export function analyzeBankStatement(csvContent: string): {
  summary: BankStatementData
  byCategory: {
    transfers: { count: number; debit: number; credit: number }
    salaries: { count: number; debit: number; credit: number }
    utilities: { count: number; debit: number; credit: number }
    rent: { count: number; debit: number; credit: number }
    loans: { count: number; debit: number; credit: number }
    others: { count: number; debit: number; credit: number }
  }
  topRemitters: { name: string; amount: number; type: 'debit' | 'credit' }[]
} {
  const parseResult = Papa.parse<BankStatementRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  const rows = parseResult.data
  const summary = parseBankStatement(csvContent)

  const byCategory = {
    transfers: { count: 0, debit: 0, credit: 0 },
    salaries: { count: 0, debit: 0, credit: 0 },
    utilities: { count: 0, debit: 0, credit: 0 },
    rent: { count: 0, debit: 0, credit: 0 },
    loans: { count: 0, debit: 0, credit: 0 },
    others: { count: 0, debit: 0, credit: 0 }
  }

  const remitterTotals: { [key: string]: { amount: number; type: 'debit' | 'credit' } } = {}

  rows.forEach(row => {
    const details = row.Details?.toLowerCase() || ''
    const debit = parseFloat(row.Debit?.replace(/,/g, '') || '0')
    const credit = parseFloat(row.Credit?.replace(/,/g, '') || '0')
    const remitter = row.Remitter?.trim() || 'Unknown'

    // Skip opening/closing rows
    if (details.includes('opening') || details.includes('ending') || details.includes('closing')) {
      return
    }

    // Categorize transactions
    if (details.includes('salary')) {
      byCategory.salaries.count++
      byCategory.salaries.debit += debit
      byCategory.salaries.credit += credit
    } else if (details.includes('utility') || details.includes('utilities')) {
      byCategory.utilities.count++
      byCategory.utilities.debit += debit
      byCategory.utilities.credit += credit
    } else if (details.includes('rent')) {
      byCategory.rent.count++
      byCategory.rent.debit += debit
      byCategory.rent.credit += credit
    } else if (details.includes('loan') || details.includes('drawdown') || details.includes('repayment')) {
      byCategory.loans.count++
      byCategory.loans.debit += debit
      byCategory.loans.credit += credit
    } else if (details.includes('transfer') || details.includes('incoming') || details.includes('outgoing')) {
      byCategory.transfers.count++
      byCategory.transfers.debit += debit
      byCategory.transfers.credit += credit
    } else {
      byCategory.others.count++
      byCategory.others.debit += debit
      byCategory.others.credit += credit
    }

    // Track remitter totals
    if (remitter && remitter !== 'Unknown') {
      if (!remitterTotals[remitter]) {
        remitterTotals[remitter] = { amount: 0, type: 'debit' }
      }

      if (debit > 0) {
        remitterTotals[remitter].amount += debit
        remitterTotals[remitter].type = 'debit'
      } else if (credit > 0) {
        remitterTotals[remitter].amount += credit
        remitterTotals[remitter].type = 'credit'
      }
    }
  })

  // Get top 5 remitters
  const topRemitters = Object.entries(remitterTotals)
    .map(([name, data]) => ({ name, amount: data.amount, type: data.type }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return {
    summary,
    byCategory,
    topRemitters
  }
}

/**
 * Format number as Vietnamese Dong
 */
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
