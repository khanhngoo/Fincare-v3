# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fincare** is a Next.js-based business loan matching platform for Vietnamese SMEs. It uses AI (Google Gemini) to analyze loan applications and match businesses with suitable loan products from Vietnamese banks.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini (gemini-2.5-pro for analysis, local scoring algorithm for baseline)
- **UI**: React with Radix UI components, Tailwind CSS
- **Document Processing**: CSV parsing with papaparse
- **PDF Generation**: @react-pdf/renderer
- **Charts**: Recharts

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests (Jest configured)
npm test
```

## Environment Variables Required

Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## Architecture Overview

### Authentication Flow
- Middleware (`middleware.ts`) handles route protection
- Protected routes: `/loan-form`, `/dashboard/*`
- Auth routes auto-redirect if authenticated: `/login`, `/register`
- Supabase Auth with SSR using `@supabase/ssr`
- Two client types:
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for server components/API routes

### Data Flow Architecture

```
User Journey:
1. Loan Form → Baseline Score Calculation (local algorithm)
2. Save to DB → Show Loan Options (from database)
3. Choose Product → Complete Documents (manual/CSV/integration)
4. Generate Analysis → AI-powered detailed report (Gemini Pro)
```

### Database Schema (5 Tables)

1. **loan_applications**: Core application data with baseline score
   - Stores: loan amount, purpose, revenue range, time in business
   - Business identity fields (business_name, registration_number, tax_code) are nullable - filled later from documents page

2. **document_data**: Uploaded/entered documents by category
   - Categories: business-identity, financial-performance, bank-statements, ownership
   - Sources: upload, manual, integration

3. **financial_metrics**: Computed financial metrics from documents
   - Extracted from document_data
   - Includes: revenue, assets, liabilities, ratios

4. **loan_products**: Bank loan products (pre-populated with 5 Vietnamese banks)
   - Vietcombank, BIDV, Techcombank, ACB, VPBank

5. **analysis_reports**: AI-generated analysis for application+product pairs
   - One analysis per (application_id, loan_product_id) pair
   - Stores Gemini's detailed evaluation

### API Routes Structure

All routes require authentication (checked via Supabase auth.getUser()):

- `POST /api/loans/calculate-baseline` - Calculate baseline score using local algorithm
- `GET /api/loans/options?applicationId=xxx` - Fetch matching loan products
- `POST /api/documents/upload` - Upload CSV to Supabase storage
- `POST /api/documents/process` - Extract metrics from CSV using Gemini
- `POST/GET /api/documents/save-data` - Save/retrieve document data
- `POST /api/analysis/generate-report` - Generate detailed AI analysis
- `GET /api/analysis/generate-report?applicationId=xxx&loanProductId=xxx` - Fetch existing analysis
- `POST /api/analysis/download-pdf` - Generate PDF report

### Key Libraries and Patterns

**AI Integration (lib/gemini.ts)**:
- Baseline scoring now uses local algorithm (`lib/scoring.ts`) for instant results
- `geminiModel` (gemini-2.5-pro): Detailed analysis with structured prompts
- `generateTailoredAnalysis()`: Product-specific scoring
- `generateDetailedReport()`: Comprehensive markdown report

**Scoring Algorithm (lib/scoring.ts)**:
- Local deterministic calculation (40% revenue, 30% time in business, 20% purpose, 10% amount ratio)
- Returns score 40-95 with reasoning
- No API calls, instant response

**Component Patterns**:
- UI components in `components/ui/` (shadcn/ui style)
- Feature components in `components/[feature]/`
- Radix UI for accessible primitives
- Use `@/` for absolute imports (configured in tsconfig.json)

**Database Access**:
- Always use `await createClient()` for server-side Supabase access
- Check authentication first in API routes
- Row Level Security (RLS) enforced on all tables
- Users can only access their own data via user_id foreign key

## Important Implementation Details

### Authentication
- All API routes must check authentication:
  ```typescript
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```

### Form Data Structure
The loan form uses simplified fields:
- `loanAmount` (number)
- `loanPurpose` (string - select from predefined options)
- `annualRevenue` (string - range: "under-1b", "1b-5b", "5b-10b", "over-10b")
- `timeInBusiness` (string - "just-starting", "less-1-year", "1-3-years", "3-plus-years")

Business identity (name, registration number, tax code) collected separately on documents page.

### Document Processing Flow
1. User uploads CSV via `/api/documents/upload` → stored in Supabase storage
2. Call `/api/documents/process` with file path → Gemini extracts metrics
3. Save extracted data via `/api/documents/save-data`
4. Metrics computed and stored in `financial_metrics` table

### Analysis Generation
- Analysis is generated once per (application, loan product) pair
- Check if exists before generating (unique constraint in DB)
- Gemini Pro generates structured JSON with:
  - overall_score (0-100)
  - score_breakdown (by category)
  - key_factors (positive/negative)
  - recommendations
  - approval_probability

### Testing
- Jest configured with Next.js integration
- Test setup in `jest.config.js` and `jest.setup.js`
- Coverage threshold: 70% across all metrics
- Use `@/` imports in tests

## Current Development Status

**Completed (75%)**:
- ✅ Full authentication system with Supabase
- ✅ Loan form with local baseline scoring
- ✅ Loan options page with real database integration
- ✅ All 8 API endpoints functional
- ✅ Database schema with RLS policies

**In Progress/TODO**:
- ⏳ Documents page integration (manual entry + CSV upload)
- ⏳ Analysis page with AI-generated reports
- ⏳ Chart components for score visualization
- ⏳ Unit and integration tests

## Database Setup

1. Create Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Create storage bucket named "documents"
4. Configure auth providers (email enabled by default)
5. For development: Disable email confirmation in Auth settings

## Common Patterns

### Server Component Data Fetching
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id)
```

### Client Component with State
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const supabase = createClient()
// Use in event handlers or effects
```

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // Process request
  return NextResponse.json({ success: true, data })
}
```

## File Structure Notes

- `app/` - Next.js 14 App Router pages
  - `app/api/` - API routes
  - `app/dashboard/` - Protected dashboard pages
  - `app/loan-form/` - Main loan application form
  - `app/login/`, `app/register/` - Auth pages
- `components/` - React components organized by feature
- `lib/` - Utilities, helpers, and client libraries
  - `lib/supabase/` - Supabase client configurations
  - `lib/gemini.ts` - Google Gemini AI integration
  - `lib/scoring.ts` - Local baseline scoring algorithm
- `supabase/` - Database schema and migrations
- `types/` - TypeScript type definitions
- `middleware.ts` - Route protection and auth middleware

## Vietnamese Currency Formatting

Always format VND amounts using:
```typescript
new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
}).format(amount)
```

## Additional Documentation

See project root for detailed guides:
- `AUTHENTICATION_GUIDE.md` - Complete auth setup instructions
- `CURRENT_STATUS.md` - Current development progress
- `README_SETUP.md` - Initial setup guide
