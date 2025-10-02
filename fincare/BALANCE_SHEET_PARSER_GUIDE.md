# Balance Sheet CSV Parser Integration Guide

## Overview

The Balance Sheet CSV Parser automatically extracts financial data from Vietnamese balance sheet CSV files and maps it to the Financial Performance form in the Documents page.

## Features

✅ **Automatic Field Mapping** - Maps Vietnamese accounting line items to form fields
✅ **Smart Value Extraction** - Handles nested items and sub-accounts
✅ **Data Validation** - Verifies balance sheet equation (Assets = Liabilities + Equity)
✅ **Error Reporting** - Provides detailed validation errors
✅ **Flexible Parsing** - Works with standard Vietnamese balance sheet formats

## File Structure

```
lib/csv-parsers/
├── balance-sheet-parser.ts              # Core parser logic
├── __tests__/
│   └── balance-sheet-parser.test.ts    # Unit tests
components/documents/
└── balance-sheet-uploader.tsx          # Upload component
```

## CSV Format Expected

The parser expects a Vietnamese balance sheet CSV with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Item | Line item name | "Cash and cash equivalents" |
| Code | Accounting code | "110" |
| NoteRef | Note reference | "V.01" |
| Current Year | Closing balance | "8000000000" |
| Prior Year | Opening balance | "5000000000" |

### Sample CSV Structure

```csv
Item,Code,NoteRef,Current Year,Prior Year
Cash and cash equivalents,110,V.01,8000000000,5000000000
Financial investments,120,V.02,1200000000,900000000
Receivables,130,V.03,9000000000,7500000000
  - Trade receivables,131,,6000000000,5200000000
  - Advances to suppliers,132,,1500000000,1200000000
Inventories,140,,7500000000,6720000000
Fixed assets (net),150,,10000000000,8600000000
...
```

## Field Mapping

### Assets Mapping

| Form Field | CSV Source | Code | Notes |
|-----------|------------|------|-------|
| Cash and cash equivalents | "Cash and cash equivalents" | 110 | Direct mapping |
| Financial investments | "Financial investments" | 120 | Direct mapping |
| Short-term loans | "Advances to suppliers" | 132 | From receivables section |
| Accounts receivable | "Trade receivables" | 131 | From receivables section |
| Inventories | "Inventories" | 140 | Direct mapping |
| Fixed assets | "Fixed assets (net)" | 150 | Net value (after depreciation) |

### Liabilities Mapping

| Form Field | CSV Source | Code | Logic |
|-----------|------------|------|-------|
| Short-term debt | "Borrowings and finance lease liabilities" | 316 | 60% of total borrowings |
| Long-term debt | "Borrowings and finance lease liabilities" | 316 | 40% of total borrowings |
| Accounts payable | "Trade payables" | 311 | Direct mapping |
| Other liabilities | Sum of other payable items | 313, 314, 315 | Taxes + Employees + Other |

### Equity Mapping

| Form Field | CSV Source | Code | Logic |
|-----------|------------|------|-------|
| Common stock | "Owner's (charter) capital" | 411 | Direct mapping |
| Retained earnings | "Retained earnings after tax" | 417 | Direct mapping |
| Other reserves | Sum of equity reserves | 412, 415, 416 | Share premium + FX diff + Reserves |

## Usage in Documents Page

### Step 1: Import the Components

```typescript
import { BalanceSheetUploader } from '@/components/documents/balance-sheet-uploader'
import { parseBalanceSheetFile } from '@/lib/csv-parsers/balance-sheet-parser'
```

### Step 2: Add Upload Component to Financial Performance Tab

```typescript
<div className="space-y-6">
  {/* Add uploader at the top */}
  <BalanceSheetUploader
    onDataParsed={(data) => {
      // Update the financial performance form with parsed data
      setFinancialPerformanceForm(data)
    }}
    onError={(error) => {
      console.error('Parse error:', error)
      // Show error toast/alert
    }}
  />

  {/* Existing manual entry form below */}
  <div className="space-y-4">
    <h3 className="font-semibold text-lg">Assets</h3>
    {/* ... existing form fields ... */}
  </div>
</div>
```

### Step 3: Complete Integration Example

```typescript
'use client'

import { useState } from 'react'
import { BalanceSheetUploader } from '@/components/documents/balance-sheet-uploader'

export default function DocumentsPage() {
  const [financialPerformanceForm, setFinancialPerformanceForm] = useState({
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
  })

  const handleBalanceSheetParsed = (parsedData: typeof financialPerformanceForm) => {
    setFinancialPerformanceForm(parsedData)
    console.log('Balance sheet data loaded:', parsedData)
    // Optional: Show success message
  }

  return (
    <div className="space-y-6">
      <BalanceSheetUploader
        onDataParsed={handleBalanceSheetParsed}
        onError={(error) => {
          console.error('Failed to parse balance sheet:', error)
          // Show error notification
        }}
      />

      {/* Manual entry form */}
      <div className="space-y-4">
        {/* ... existing form fields ... */}
      </div>
    </div>
  )
}
```

## API Usage (Without Component)

If you want to use the parser directly without the component:

```typescript
import { parseBalanceSheetFile, validateBalanceSheetData } from '@/lib/csv-parsers/balance-sheet-parser'

async function handleFileUpload(file: File) {
  try {
    // Parse the file
    const data = await parseBalanceSheetFile(file)

    // Validate the data
    const validation = validateBalanceSheetData(data)

    if (validation.valid) {
      console.log('Valid balance sheet:', data)
      // Use the data
    } else {
      console.warn('Balance sheet has issues:', validation.errors)
      // Still can use the data, but warn user
    }

    return data
  } catch (error) {
    console.error('Parse error:', error)
    throw error
  }
}
```

## Validation Rules

The parser validates:

1. **Required Fields** - Ensures key fields are populated:
   - Cash and cash equivalents
   - Inventories
   - Fixed assets
   - Accounts payable
   - Common stock

2. **Balance Sheet Equation** - Verifies: `Assets = Liabilities + Equity`
   - Allows 1% tolerance for rounding differences
   - Checks both opening and closing balances

3. **Data Format** - Ensures:
   - Numeric values are valid
   - Required columns exist
   - CSV structure is correct

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing [field] data" | Required field not found in CSV | Add the missing line item to CSV |
| "Balance sheet does not balance" | Assets ≠ Liabilities + Equity | Check CSV for calculation errors |
| "Failed to parse CSV" | Invalid CSV format | Verify CSV has correct columns |
| "Failed to read file" | File access error | Check file permissions |

### Example Error Response

```typescript
{
  valid: false,
  errors: [
    "Missing Cash and cash equivalents data",
    "Balance sheet does not balance for current year"
  ]
}
```

## Testing

Run the parser tests:

```bash
npm test balance-sheet-parser
```

### Test Coverage

- ✅ Parsing all asset fields
- ✅ Parsing all liability fields
- ✅ Parsing all equity fields
- ✅ Aggregating sub-accounts
- ✅ Splitting borrowings into short/long term
- ✅ Validation logic
- ✅ Error handling

## Advanced Usage

### Custom Mapping

If you need to customize the field mapping:

```typescript
import { parseBalanceSheet } from '@/lib/csv-parsers/balance-sheet-parser'

// Read CSV content
const csvContent = await file.text()

// Parse with custom logic
const data = parseBalanceSheet(csvContent)

// Modify parsed data before using
data.assets.custom_field = { opening: '100', closing: '200' }
```

### Batch Processing

Process multiple CSV files:

```typescript
async function processMultipleBalanceSheets(files: File[]) {
  const results = await Promise.all(
    files.map(file => parseBalanceSheetFile(file))
  )

  return results
}
```

## Sample Data Location

Test CSV file: `/home/khanhngoo/Downloads/balance_sheet_strong.csv`

This file contains a complete Vietnamese balance sheet with:
- Total Assets: 37.5B VND (current), 30.2B VND (prior)
- Total Liabilities: 14.85B VND (current), 13.18B VND (prior)
- Owner's Equity: 22.65B VND (current), 17.01B VND (prior)

## Integration Checklist

- [ ] Import `BalanceSheetUploader` component
- [ ] Add component to Financial Performance tab
- [ ] Connect `onDataParsed` callback to form state
- [ ] Add error handling with `onError` callback
- [ ] Test with sample CSV file
- [ ] Verify data populates form correctly
- [ ] Check validation errors display properly
- [ ] Add success/error notifications
- [ ] Test with invalid CSV files
- [ ] Verify balance sheet equation validation

## Next Steps

After integrating the parser:

1. **Add Income Statement Parser** - Similar pattern for P&L data
2. **Add Bank Statement Parser** - For cash flow analysis
3. **Add Multiple File Upload** - Handle multiple years
4. **Add Export Functionality** - Download populated data
5. **Add Template Download** - Provide CSV template for users

## Support

For issues or questions:
- Check test file: `__tests__/balance-sheet-parser.test.ts`
- Review sample CSV: `/home/khanhngoo/Downloads/balance_sheet_strong.csv`
- See component example: `components/documents/balance-sheet-uploader.tsx`
