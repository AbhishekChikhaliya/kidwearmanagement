
-- Create storage bucket for supplier bills
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-bills', 'supplier-bills', false);

-- RLS: authenticated users can upload bills
CREATE POLICY "Authenticated users can upload bills"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supplier-bills');

-- RLS: authenticated users can read their bills
CREATE POLICY "Authenticated users can read bills"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supplier-bills');

-- RLS: authenticated users can delete bills
CREATE POLICY "Authenticated users can delete bills"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'supplier-bills');
