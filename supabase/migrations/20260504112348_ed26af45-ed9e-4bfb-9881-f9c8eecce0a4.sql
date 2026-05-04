
-- Recreate function with locked-down execute permissions
CREATE OR REPLACE FUNCTION public.create_default_shop_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.shop_settings (user_id, shop_name)
  VALUES (NEW.id, 'KidWear Retail')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_default_shop_settings() FROM PUBLIC, anon, authenticated;

-- Ensure trigger exists on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_shop_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_shop_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_shop_settings();
