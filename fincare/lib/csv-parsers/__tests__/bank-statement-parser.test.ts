import { parseBankStatement, validateBankStatementData, analyzeBankStatement } from '../bank-statement-parser'

const sampleCSV = `Transaction date,Remitter,Remitter bank,Details,Transaction No.,Debit,Credit,Fee/Interest,Tax,Balance
2024-07-01,,,Opening balance,,0,0,0,0,820000000
2024-07-01,Lan Anh Services,BIDV,Loan repayment,FT24070150477742,18676961,0,0,0,801323039
2024-07-01,Nhat Nam Group,BIDV,Transfer to supplier,FT24070198787891,51600900,0,0,0,749722139
2024-07-01,Kim Long Import,Agribank,Customer transfer,FT24070124165187,0,117758659,0,0,867480798
2024-07-02,Kim Long Import,MB Bank,Utility payment,FT24070289520597,63461818,0,0,0,850087228
2024-07-02,Lan Anh Services,BIDV,Refund received,FT24070272372114,0,126011240,0,0,976098468
2024-07-03,Phuoc Long JSC,Agribank,Refund received,FT24070379340535,0,79160281,0,0,1192948139
2024-07-03,Minh Quan Retail,Techcombank,Rent payment,FT24070342255732,70575808,0,0,0,1122372331
2024-07-04,Bao Chau Foods,ACB,Refund received,FT24070435848226,0,72485660,0,0,1098082700
2024-07-04,Kim Long Import,Vietcombank,Cash deposit,FT24070447111151,0,63085309,0,0,1161168009
2024-07-04,Kim Long Import,ACB,Salary payment,FT24070440532273,116753487,0,0,0,1044414522
2024-07-05,Hoa Binh Logistics,MB Bank,Customer transfer,FT24070573001391,0,8292468,0,0,1069925017
2024-07-31,,,Ending balance,,0,0,0,0,2840626515`

describe('Bank Statement Parser', () => {
  describe('parseBankStatement', () => {
    it('should extract opening balance correctly', () => {
      const result = parseBankStatement(sampleCSV)

      expect(result.opening_balance).toBe('820000000')
    })

    it('should extract closing balance correctly', () => {
      const result = parseBankStatement(sampleCSV)

      expect(result.closing_balance).toBe('2840626515')
    })

    it('should calculate total debit correctly', () => {
      const result = parseBankStatement(sampleCSV)

      // Sum: 18676961 + 51600900 + 63461818 + 70575808 + 116753487 = 321068974
      expect(result.total_debit).toBe('321068974')
    })

    it('should calculate total credit correctly', () => {
      const result = parseBankStatement(sampleCSV)

      // Sum: 117758659 + 126011240 + 79160281 + 72485660 + 63085309 + 8292468 = 466793617
      expect(result.total_credit).toBe('466793617')
    })

    it('should count transactions correctly (excluding opening/closing)', () => {
      const result = parseBankStatement(sampleCSV)

      // 11 transactions (excluding opening and closing balance rows)
      expect(result.transaction_count).toBe(11)
    })

    it('should extract start and end dates', () => {
      const result = parseBankStatement(sampleCSV)

      expect(result.start_date).toBe('2024-07-01')
      expect(result.end_date).toBe('2024-07-31')
    })

    it('should handle CSV without explicit closing balance row', () => {
      const csvWithoutClosing = `Transaction date,Remitter,Remitter bank,Details,Transaction No.,Debit,Credit,Fee/Interest,Tax,Balance
2024-07-01,,,Opening balance,,0,0,0,0,1000000
2024-07-02,Test Company,ACB,Payment,FT123,500000,0,0,0,500000
2024-07-03,Test Company,ACB,Receipt,FT124,0,300000,0,0,800000`

      const result = parseBankStatement(csvWithoutClosing)

      expect(result.opening_balance).toBe('1000000')
      expect(result.closing_balance).toBe('800000')
    })
  })

  describe('validateBankStatementData', () => {
    it('should pass validation for valid data', () => {
      const data = parseBankStatement(sampleCSV)
      const validation = validateBankStatementData(data)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should fail when opening balance is missing', () => {
      const data = {
        opening_balance: '0',
        closing_balance: '1000000',
        total_debit: '500000',
        total_credit: '500000'
      }

      const validation = validateBankStatementData(data)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Opening balance not found or is zero')
    })

    it('should fail when closing balance is missing', () => {
      const data = {
        opening_balance: '1000000',
        closing_balance: '0',
        total_debit: '500000',
        total_credit: '500000'
      }

      const validation = validateBankStatementData(data)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Closing balance not found or is zero')
    })

    it('should warn when balance equation does not match', () => {
      const data = {
        opening_balance: '1000000',
        closing_balance: '2000000', // Should be 1500000 (1000000 + 1000000 - 500000)
        total_debit: '500000',
        total_credit: '1000000'
      }

      const validation = validateBankStatementData(data)

      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings[0]).toContain('Balance verification warning')
    })

    it('should warn when no transactions found', () => {
      const data = {
        opening_balance: '1000000',
        closing_balance: '1000000',
        total_debit: '0',
        total_credit: '0',
        transaction_count: 0
      }

      const validation = validateBankStatementData(data)

      expect(validation.warnings).toContain('No debit transactions found')
      expect(validation.warnings).toContain('No credit transactions found')
      expect(validation.warnings).toContain('No transactions found (excluding opening/closing balance rows)')
    })
  })

  describe('analyzeBankStatement', () => {
    it('should categorize transactions correctly', () => {
      const analysis = analyzeBankStatement(sampleCSV)

      // Should have salary transactions
      expect(analysis.byCategory.salaries.count).toBeGreaterThan(0)

      // Should have utility transactions
      expect(analysis.byCategory.utilities.count).toBeGreaterThan(0)

      // Should have rent transactions
      expect(analysis.byCategory.rent.count).toBeGreaterThan(0)

      // Should have loan transactions
      expect(analysis.byCategory.loans.count).toBeGreaterThan(0)
    })

    it('should identify top remitters', () => {
      const analysis = analyzeBankStatement(sampleCSV)

      expect(analysis.topRemitters.length).toBeGreaterThan(0)
      expect(analysis.topRemitters.length).toBeLessThanOrEqual(5)

      // Top remitters should have name and amount
      analysis.topRemitters.forEach(remitter => {
        expect(remitter.name).toBeDefined()
        expect(remitter.amount).toBeGreaterThan(0)
        expect(['debit', 'credit']).toContain(remitter.type)
      })
    })

    it('should calculate category totals correctly', () => {
      const analysis = analyzeBankStatement(sampleCSV)

      // Verify utilities category
      const utilitiesTotal = analysis.byCategory.utilities.debit + analysis.byCategory.utilities.credit
      expect(utilitiesTotal).toBeGreaterThan(0)

      // Verify salaries category
      const salariesTotal = analysis.byCategory.salaries.debit + analysis.byCategory.salaries.credit
      expect(salariesTotal).toBeGreaterThan(0)
    })

    it('should match summary totals', () => {
      const analysis = analyzeBankStatement(sampleCSV)

      expect(analysis.summary.opening_balance).toBe('820000000')
      expect(analysis.summary.closing_balance).toBe('2840626515')
      expect(analysis.summary.total_debit).toBe('321068974')
      expect(analysis.summary.total_credit).toBe('466793617')
    })
  })
})
