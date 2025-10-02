# Fincare API Integration Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
Dependencies have already been installed:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Supabase SSR utilities
- `@google/generative-ai` - Gemini AI SDK
- `papaparse` - CSV parsing library

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

#### Run the Database Schema
1. Open the Supabase SQL Editor
2. Copy and paste the contents of `/supabase/schema.sql`
3. Run the SQL commands
4. This will create:
   - `loan_applications` table
   - `financial_metrics` table
   - `loan_products` table (with 5 sample Vietnamese bank products)
   - `analysis_reports` table
   - All necessary indexes and RLS policies

#### Set Up Storage
1. Go to Storage in Supabase dashboard
2. Create a new bucket called `documents`
3. Set it to **public** or configure appropriate policies

### 3. Get Gemini API Key
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 4. Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

### 5. Test the Setup
```bash
npm run dev
```

## 📁 Project Structure

### API Endpoints Created

#### `/app/api/loans/calculate-baseline/route.ts`
- **POST** - Calculate baseline credit score from loan form
- Input: Loan form data
- Output: Baseline score + saved application
- Uses: Gemini AI

#### `/app/api/documents/upload/route.ts`
- **POST** - Upload CSV files to Supabase Storage
- Input: File + applicationId + category
- Output: File metadata and URL

#### `/app/api/documents/process/route.ts`
- **POST** - Process uploaded CSV and extract financial metrics
- Input: filePath + applicationId + category
- Output: Extracted financial metrics
- Supports: Balance sheets, P&L statements, cash flow

#### `/app/api/loans/options/route.ts`
- **GET** - Fetch available loan products
- Query params: ?applicationId (optional)
- Output: List of loan products with estimated scores

#### `/app/api/analysis/generate-report/route.ts`
- **POST** - Generate tailored analysis for specific loan product
- Input: applicationId + loanProductId
- Output: Detailed analysis with scores, breakdown, factors, recommendations
- **GET** - Retrieve existing analysis
- Query params: ?applicationId=xxx&loanProductId=xxx

### Core Libraries

#### `/lib/supabase/client.ts`
Browser-side Supabase client for client components

#### `/lib/supabase/server.ts`
Server-side Supabase client for API routes and server components

#### `/lib/gemini.ts`
Gemini AI integration with two main functions:
- `calculateBaselineScore()` - Initial credit score from form
- `generateTailoredAnalysis()` - Detailed analysis per loan product

#### `/types/database.types.ts`
TypeScript types for all database tables

## 🗄️ Database Schema

### Tables Created:

1. **loan_applications**
   - Stores loan application form data
   - Includes baseline_score from Gemini
   - Links to user via auth.users

2. **financial_metrics**
   - Stores extracted data from CSV files
   - Includes calculated ratios
   - Links to loan_applications

3. **loan_products**
   - Catalog of bank loan products
   - Pre-seeded with 5 Vietnamese banks
   - Includes eligibility criteria

4. **analysis_reports**
   - Stores tailored analysis per loan product
   - Includes scores, breakdown, recommendations
   - Unique per (application, loan_product) pair

## 🔄 Data Flow

### Loan Application Flow:
1. User fills `/loan-form` → Submit
2. API calls `/api/loans/calculate-baseline`
3. Gemini calculates baseline score
4. Application saved to `loan_applications`
5. User redirected to `/dashboard/loan-options`

### Document Processing Flow:
1. User uploads CSV in `/dashboard/documents`
2. API calls `/api/documents/upload`
3. File saved to Supabase Storage
4. API calls `/api/documents/process`
5. Metrics extracted and saved to `financial_metrics`

### Analysis Generation Flow:
1. User selects loan option in `/dashboard/loan-options`
2. User clicks "Analyze" button
3. API calls `/api/analysis/generate-report`
4. Gemini generates tailored analysis
5. Report saved to `analysis_reports`
6. User views analysis in `/dashboard/analysis?loanProductId=xxx`

## 🔒 Security

- **RLS (Row Level Security)** enabled on all tables
- Users can only access their own data
- Supabase Auth handles authentication
- File uploads validated (CSV only)

## 📝 Next Steps

To complete the integration, you need to:

1. **Update Loan Form** (`/app/loan-form/page.tsx`)
   - Replace localStorage with API call to `/api/loans/calculate-baseline`

2. **Update Loan Options Page** (`/app/dashboard/loan-options/page.tsx`)
   - Fetch from `/api/loans/options` instead of mockLoanOptions

3. **Update Documents Page** (`/app/dashboard/documents/page.tsx`)
   - Add CSV upload functionality
   - Call `/api/documents/upload` and `/api/documents/process`

4. **Update Analysis Page** (`/app/dashboard/analysis/page.tsx`)
   - Accept `loanProductId` query param
   - Fetch from `/api/analysis/generate-report`
   - Display charts and visualizations

5. **Create Chart Components**
   - ScoreGauge component
   - BreakdownChart component
   - KeyFactors component

## 🐛 Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**
   - Make sure Supabase Auth is set up
   - Check if user is logged in

2. **"Failed to parse Gemini response"**
   - Check Gemini API key is valid
   - Verify API quota

3. **CSV processing fails**
   - Ensure CSV format matches expected structure
   - Check file is valid CSV

4. **RLS policy errors**
   - Verify user_id matches auth.uid()
   - Check RLS policies in Supabase dashboard
