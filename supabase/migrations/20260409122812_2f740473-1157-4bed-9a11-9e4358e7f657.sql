
CREATE TABLE public.shop_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name text NOT NULL DEFAULT 'KidWear Retail',
  shop_phone text DEFAULT '',
  shop_address text DEFAULT '',
  shop_email text DEFAULT '',
  gst_number text DEFAULT '',
  shop_tagline text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shop settings"
ON public.shop_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update shop settings"
ON public.shop_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shop settings"
ON public.shop_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Seed with default row
INSERT INTO public.shop_settings (shop_name) VALUES ('KidWear Retail');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shop_settings_updated_at
BEFORE UPDATE ON public.shop_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
