export interface Database {
  public: {
    Tables: {
      loan_applications: {
        Row: {
          id: string
          user_id: string
          business_name: string
          registration_number: string
          tax_code: string
          loan_amount: number
          loan_purpose: string
          annual_revenue: string
          time_in_business: string
          baseline_score: number | null
          baseline_reasoning: string | null
          form_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          registration_number: string
          tax_code: string
          loan_amount: number
          loan_purpose: string
          annual_revenue: string
          time_in_business: string
          baseline_score?: number | null
          baseline_reasoning?: string | null
          form_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          registration_number?: string
          tax_code?: string
          loan_amount?: number
          loan_purpose?: string
          annual_revenue?: string
          time_in_business?: string
          baseline_score?: number | null
          baseline_reasoning?: string | null
          form_data?: any
          created_at?: string
          updated_at?: string
        }
      }
      financial_metrics: {
        Row: {
          id: string
          application_id: string
          annual_revenue: number | null
          total_assets: number | null
          total_liabilities: number | null
          current_ratio: number | null
          debt_to_equity: number | null
          profit_margin: number | null
          extracted_data: any
          file_metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          annual_revenue?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          profit_margin?: number | null
          extracted_data: any
          file_metadata: any
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          annual_revenue?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          profit_margin?: number | null
          extracted_data?: any
          file_metadata?: any
          created_at?: string
        }
      }
      loan_products: {
        Row: {
          id: string
          bank_name: string
          product_name: string
          product_type: string
          interest_rate_range: string
          tenor_range: string
          max_amount: number
          min_amount: number
          features: string[]
          required_docs: string[]
          eligibility_criteria: any
          created_at: string
        }
        Insert: {
          id?: string
          bank_name: string
          product_name: string
          product_type: string
          interest_rate_range: string
          tenor_range: string
          max_amount: number
          min_amount: number
          features: string[]
          required_docs: string[]
          eligibility_criteria: any
          created_at?: string
        }
        Update: {
          id?: string
          bank_name?: string
          product_name?: string
          product_type?: string
          interest_rate_range?: string
          tenor_range?: string
          max_amount?: number
          min_amount?: number
          features?: string[]
          required_docs?: string[]
          eligibility_criteria?: any
          created_at?: string
        }
      }
      analysis_reports: {
        Row: {
          id: string
          application_id: string
          loan_product_id: string
          overall_score: number
          score_breakdown: any
          key_factors: any
          recommendations: string[]
          approval_probability: number
          gemini_response: any
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          loan_product_id: string
          overall_score: number
          score_breakdown: any
          key_factors: any
          recommendations: string[]
          approval_probability: number
          gemini_response: any
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          loan_product_id?: string
          overall_score?: number
          score_breakdown?: any
          key_factors?: any
          recommendations?: string[]
          approval_probability?: number
          gemini_response?: any
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier usage
export type LoanApplication = Database['public']['Tables']['loan_applications']['Row']
export type LoanApplicationInsert = Database['public']['Tables']['loan_applications']['Insert']
export type FinancialMetrics = Database['public']['Tables']['financial_metrics']['Row']
export type FinancialMetricsInsert = Database['public']['Tables']['financial_metrics']['Insert']
export type LoanProduct = Database['public']['Tables']['loan_products']['Row']
export type AnalysisReport = Database['public']['Tables']['analysis_reports']['Row']
export type AnalysisReportInsert = Database['public']['Tables']['analysis_reports']['Insert']
