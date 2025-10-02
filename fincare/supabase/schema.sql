-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Loan Applications Table
create table public.loan_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  business_name text,  -- Optional, filled from documents page
  registration_number text,  -- Optional, filled from documents page
  tax_code text,  -- Optional, filled from documents page
  loan_amount numeric not null,
  loan_purpose text not null,
  annual_revenue text not null,
  time_in_business text not null,
  baseline_score integer,
  baseline_reasoning text,
  form_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Document Data Table (stores all document categories)
create table public.document_data (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references public.loan_applications(id) on delete cascade not null,
  category text not null check (category in ('business-identity', 'financial-performance', 'bank-statements')),
  data jsonb not null,
  source text not null check (source in ('upload', 'manual', 'integration')),
  file_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(application_id, category)
);

-- Financial Metrics Table (computed/aggregated metrics)
create table public.financial_metrics (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references public.loan_applications(id) on delete cascade not null,
  -- Computed metrics from document_data
  annual_revenue numeric,
  total_assets numeric,
  total_liabilities numeric,
  total_equity numeric,
  current_ratio numeric,
  debt_to_equity numeric,
  profit_margin numeric,
  -- Bank statement metrics
  opening_balance numeric,
  closing_balance numeric,
  total_debit numeric,
  total_credit numeric,
  -- Full extracted data
  extracted_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Loan Products Table
create table public.loan_products (
  id uuid primary key default uuid_generate_v4(),
  bank_name text not null,
  product_name text not null,
  product_type text not null,
  interest_rate_range text not null,
  tenor_range text not null,
  max_amount numeric not null,
  min_amount numeric not null,
  features text[] not null default '{}',
  required_docs text[] not null default '{}',
  eligibility_criteria jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Analysis Reports Table
create table public.analysis_reports (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references public.loan_applications(id) on delete cascade not null,
  loan_product_id uuid references public.loan_products(id) on delete cascade not null,
  overall_score integer not null,
  score_breakdown jsonb not null,
  key_factors jsonb not null,
  recommendations text[] not null default '{}',
  approval_probability numeric not null,
  gemini_response jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(application_id, loan_product_id)
);

-- Enable Row Level Security
alter table public.loan_applications enable row level security;
alter table public.document_data enable row level security;
alter table public.financial_metrics enable row level security;
alter table public.loan_products enable row level security;
alter table public.analysis_reports enable row level security;

-- RLS Policies for loan_applications
create policy "Users can view their own applications"
  on public.loan_applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.loan_applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.loan_applications for update
  using (auth.uid() = user_id);

-- RLS Policies for document_data
create policy "Users can view their own documents"
  on public.document_data for select
  using (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = document_data.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own documents"
  on public.document_data for insert
  with check (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = document_data.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

create policy "Users can update their own documents"
  on public.document_data for update
  using (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = document_data.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

-- RLS Policies for financial_metrics
create policy "Users can view their own financial metrics"
  on public.financial_metrics for select
  using (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = financial_metrics.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own financial metrics"
  on public.financial_metrics for insert
  with check (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = financial_metrics.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

-- RLS Policies for loan_products (public read access)
create policy "Anyone can view loan products"
  on public.loan_products for select
  to authenticated
  using (true);

-- RLS Policies for analysis_reports
create policy "Users can view their own analysis reports"
  on public.analysis_reports for select
  using (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = analysis_reports.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own analysis reports"
  on public.analysis_reports for insert
  with check (
    exists (
      select 1 from public.loan_applications
      where loan_applications.id = analysis_reports.application_id
      and loan_applications.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
create index loan_applications_user_id_idx on public.loan_applications(user_id);
create index document_data_application_id_idx on public.document_data(application_id);
create index document_data_category_idx on public.document_data(category);
create index financial_metrics_application_id_idx on public.financial_metrics(application_id);
create index analysis_reports_application_id_idx on public.analysis_reports(application_id);
create index analysis_reports_loan_product_id_idx on public.analysis_reports(loan_product_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger set_updated_at
  before update on public.loan_applications
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_document_data
  before update on public.document_data
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_financial_metrics
  before update on public.financial_metrics
  for each row
  execute function public.handle_updated_at();

-- Insert sample loan products
insert into public.loan_products (bank_name, product_name, product_type, interest_rate_range, tenor_range, max_amount, min_amount, features, required_docs, eligibility_criteria) values
('Vietcombank', 'Business Growth Loan', 'business', '8.5% - 11.5%', '12-60 months', 10000000000, 100000000, ARRAY['Flexible repayment', 'No prepayment penalty', 'Quick approval'], ARRAY['Business registration', 'Tax documents', 'Financial statements', 'Bank statements'], '{"min_revenue": 500000000, "min_time_in_business": "12 months", "max_debt_ratio": 0.7}'::jsonb),
('BIDV', 'SME Development Loan', 'business', '7.8% - 10.5%', '12-84 months', 15000000000, 50000000, ARRAY['Competitive rates', 'Long tenor options', 'Dedicated support'], ARRAY['Business license', 'Financial reports', 'Collateral documents'], '{"min_revenue": 300000000, "min_time_in_business": "6 months", "max_debt_ratio": 0.75}'::jsonb),
('Techcombank', 'Tech Innovation Loan', 'business', '9.0% - 12.0%', '12-48 months', 5000000000, 50000000, ARRAY['Fast processing', 'Flexible terms', 'Technology focus'], ARRAY['Business plan', 'Financial statements', 'Tech certifications'], '{"min_revenue": 200000000, "min_time_in_business": "6 months", "tech_focus": true}'::jsonb),
('ACB', 'Working Capital Loan', 'business', '8.0% - 11.0%', '6-36 months', 8000000000, 100000000, ARRAY['Quick disbursement', 'Revolving credit', 'Online management'], ARRAY['Business registration', 'Tax code', 'Bank statements'], '{"min_revenue": 400000000, "min_time_in_business": "12 months"}'::jsonb),
('VPBank', 'Export-Import Loan', 'business', '7.5% - 10.0%', '12-60 months', 20000000000, 200000000, ARRAY['Trade finance support', 'Multi-currency', 'Export incentives'], ARRAY['Export license', 'Trade contracts', 'Financial statements'], '{"min_revenue": 1000000000, "export_business": true}'::jsonb);
