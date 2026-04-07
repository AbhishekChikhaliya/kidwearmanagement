
-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses table
CREATE TYPE public.expense_category AS ENUM ('rent', 'salary', 'utilities', 'transport', 'packaging', 'marketing', 'maintenance', 'other');

CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add customer_id, discount, payment_mode, invoice_no to sales
ALTER TABLE public.sales 
  ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN discount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN payment_mode TEXT NOT NULL DEFAULT 'cash',
  ADD COLUMN invoice_no TEXT;
