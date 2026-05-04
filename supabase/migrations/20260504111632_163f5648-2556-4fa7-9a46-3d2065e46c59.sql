
-- Helper: get first user id
DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Add user_id columns (nullable first for backfill)
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
  ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS user_id uuid;

  IF first_user IS NOT NULL THEN
    UPDATE public.products SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.categories SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.suppliers SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.customers SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.sales SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.expenses SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.returns SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.inventory_logs SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.purchase_orders SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.notifications SET user_id = first_user WHERE user_id IS NULL;
    UPDATE public.shop_settings SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

-- Defaults so inserts auto-tag the current user
ALTER TABLE public.products ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.suppliers ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.customers ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.sales ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.expenses ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.returns ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.inventory_logs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.purchase_orders ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.notifications ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.shop_settings ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Enforce NOT NULL going forward
ALTER TABLE public.products ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.returns ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.inventory_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.shop_settings ALTER COLUMN user_id SET NOT NULL;

-- Drop old permissive policies and replace with per-user policies
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can manage returns" ON public.returns;
DROP POLICY IF EXISTS "Authenticated users can manage inventory_logs" ON public.inventory_logs;
DROP POLICY IF EXISTS "Authenticated users can manage purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Authenticated users can update shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Authenticated users can insert shop settings" ON public.shop_settings;

-- Create per-user policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['products','categories','suppliers','customers','sales','expenses','returns','inventory_logs','purchase_orders','notifications','shop_settings'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Users can view own %1$s" ON public.%1$I FOR SELECT TO authenticated USING (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Users can update own %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Users can delete own %1$s" ON public.%1$I FOR DELETE TO authenticated USING (user_id = auth.uid())', t);
  END LOOP;
END $$;

-- Auto-create default shop_settings row for each new user via trigger
CREATE OR REPLACE FUNCTION public.create_default_shop_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shop_settings (user_id, shop_name)
  VALUES (NEW.id, 'KidWear Retail');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_shop_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_shop_settings
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_default_shop_settings();
