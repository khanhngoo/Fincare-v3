import { parseBalanceSheet, validateBalanceSheetData } from '../balance-sheet-parser'

const sampleCSV = `Item,Code,NoteRef,Current Year,Prior Year
Cash and cash equivalents,110,V.01,8000000000,5000000000
Financial investments,120,V.02,1200000000,900000000
  - Trading securities,121,,600000000,500000000
  - Held-to-maturity investments,122,,500000000,350000000
  - Investments in other entities,123,,100000000,50000000
Receivables,130,V.03,9000000000,7500000000
  - Trade receivables,131,,6000000000,5200000000
  - Advances to suppliers,132,,1500000000,1200000000
  - Capital invested in subsidiaries/branches,133,,300000000,250000000
  - Other receivables,134,,1600000000,1200000000
  - Allowance for doubtful receivables (*),136,V.04,-400000000,-350000000
Inventories,140,,7500000000,6720000000
  - Inventories,141,,7800000000,7000000000
  - Allowance for inventory devaluation (*),142,V.05,-300000000,-280000000
Fixed assets (net),150,,10000000000,8600000000
  - Historical cost,151,,14000000000,12000000000
  - Accumulated depreciation (*),152,,-4000000000,-3400000000
Investment properties (net),160,V.06,1000000000,820000000
  - Historical cost,161,,1200000000,1000000000
  - Accumulated depreciation (*),162,,-200000000,-180000000
Construction in progress,170,V.07,500000000,400000000
Other assets,180,V.08,300000000,250000000
  - Deductible VAT,181,,180000000,150000000
  - Other assets,182,,120000000,100000000
TOTAL ASSETS (200),200,,37500000000,30190000000
Short-term and long-term liabilities,300,,14850000000,13180000000
  - Trade payables,311,V.09.a,6500000000,5800000000
  - Advances from customers,312,V.09.b,1000000000,900000000
  - Taxes and statutory obligations payable,313,V.10,800000000,650000000
  - Payables to employees,314,,400000000,350000000
  - Other payables,315,V.09.c,600000000,520000000
  - Borrowings and finance lease liabilities,316,V.11,5000000000,4500000000
  - Provisions,318,V.12,300000000,250000000
  - Bonus and welfare fund,319,,200000000,170000000
  - Science and technology development fund,320,V.13,50000000,40000000
Owner's equity,400,,22650000000,17010000000
  - Owner's (charter) capital,411,,3000000000,3000000000
  - Share premium,412,,2000000000,1800000000
  - Foreign exchange differences,415,,50000000,40000000
  - Reserves and other funds,416,,300000000,260000000
  - Retained earnings after tax,417,,17300000000,11910000000
TOTAL LIABILITIES & EQUITY (500),500,,37500000000,30190000000`

describe('Balance Sheet Parser', () => {
  describe('parseBalanceSheet', () => {
    it('should parse cash and cash equivalents correctly', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.cash_and_equivalents).toEqual({
        opening: '5000000000',
        closing: '8000000000'
      })
    })

    it('should parse financial investments correctly', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.financial_investments).toEqual({
        opening: '900000000',
        closing: '1200000000'
      })
    })

    it('should parse inventories correctly', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.inventories).toEqual({
        opening: '6720000000',
        closing: '7500000000'
      })
    })

    it('should parse fixed assets correctly', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.fixed_assets).toEqual({
        opening: '8600000000',
        closing: '10000000000'
      })
    })

    it('should parse accounts receivable from trade receivables', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.accounts_receivable).toEqual({
        opening: '5200000000',
        closing: '6000000000'
      })
    })

    it('should parse short-term loans from advances to suppliers', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.assets.short_term_loans).toEqual({
        opening: '1200000000',
        closing: '1500000000'
      })
    })

    it('should split borrowings into short-term and long-term debt', () => {
      const result = parseBalanceSheet(sampleCSV)

      // 60% short-term
      expect(result.liabilities.short_term_debt).toEqual({
        opening: '2700000000', // 4500000000 * 0.6
        closing: '3000000000'  // 5000000000 * 0.6
      })

      // 40% long-term
      expect(result.liabilities.long_term_debt).toEqual({
        opening: '1800000000', // 4500000000 * 0.4
        closing: '2000000000'  // 5000000000 * 0.4
      })
    })

    it('should parse accounts payable from trade payables', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.liabilities.accounts_payable).toEqual({
        opening: '5800000000',
        closing: '6500000000'
      })
    })

    it('should aggregate other liabilities', () => {
      const result = parseBalanceSheet(sampleCSV)

      // Other payables + Taxes payable + Employee payables
      // 520000000 + 650000000 + 350000000 = 1520000000 (opening)
      // 600000000 + 800000000 + 400000000 = 1800000000 (closing)
      expect(result.liabilities.other_liabilities).toEqual({
        opening: '1520000000',
        closing: '1800000000'
      })
    })

    it('should parse common stock from owner capital', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.equity.common_stock).toEqual({
        opening: '3000000000',
        closing: '3000000000'
      })
    })

    it('should parse retained earnings correctly', () => {
      const result = parseBalanceSheet(sampleCSV)

      expect(result.equity.retained_earnings).toEqual({
        opening: '11910000000',
        closing: '17300000000'
      })
    })

    it('should aggregate other reserves', () => {
      const result = parseBalanceSheet(sampleCSV)

      // Reserves + Share premium + FX differences
      // 260000000 + 1800000000 + 40000000 = 2100000000 (opening)
      // 300000000 + 2000000000 + 50000000 = 2350000000 (closing)
      expect(result.equity.other_reserves).toEqual({
        opening: '2100000000',
        closing: '2350000000'
      })
    })
  })

  describe('validateBalanceSheetData', () => {
    it('should pass validation for complete data', () => {
      const data = parseBalanceSheet(sampleCSV)
      const validation = validateBalanceSheetData(data)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const data = parseBalanceSheet(sampleCSV)

      // Clear a required field
      data.assets.cash_and_equivalents = { opening: '', closing: '' }

      const validation = validateBalanceSheetData(data)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Missing Cash and cash equivalents data')
    })
  })
})
