import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Lock, Store, Save, Pencil, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const [shopEditing, setShopEditing] = useState(false);
  const [shopSaving, setShopSaving] = useState(false);
  const [shopSettings, setShopSettings] = useState({
    id: '',
    shop_name: 'KidWear Retail',
    shop_phone: '',
    shop_address: '',
    shop_email: '',
    gst_number: '',
    shop_tagline: '',
  });

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    const { data } = await supabase.from('shop_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setShopSettings({
        id: data.id,
        shop_name: data.shop_name || '',
        shop_phone: data.shop_phone || '',
        shop_address: data.shop_address || '',
        shop_email: data.shop_email || '',
        gst_number: data.gst_number || '',
        shop_tagline: data.shop_tagline || '',
      });
    } else {
      // No settings row yet for this user — create a default one
      const { data: created } = await supabase
        .from('shop_settings')
        .insert({ shop_name: 'KidWear Retail' })
        .select()
        .single();
      if (created) {
        setShopSettings({
          id: created.id,
          shop_name: created.shop_name || '',
          shop_phone: created.shop_phone || '',
          shop_address: created.shop_address || '',
          shop_email: created.shop_email || '',
          gst_number: created.gst_number || '',
          shop_tagline: created.shop_tagline || '',
        });
      }
    }
  };

  const handleSaveShop = async () => {
    setShopSaving(true);
    const { error } = await supabase.from('shop_settings').update({
      shop_name: shopSettings.shop_name,
      shop_phone: shopSettings.shop_phone,
      shop_address: shopSettings.shop_address,
      shop_email: shopSettings.shop_email,
      gst_number: shopSettings.gst_number,
      shop_tagline: shopSettings.shop_tagline,
    }).eq('id', shopSettings.id);
    setShopSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('shopSettingsSaved'));
    setShopEditing(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('passwordChanged'));
    setPasswordForm({ newPass: '', confirm: '' });
  };

  const updateShop = (field: string, value: string) => {
    setShopSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <PageHeader title={t('settings')} subtitle="Customize your shop preferences" emoji="⚙️" icon={<SettingsIcon className="h-6 w-6" />} />
      {/* Shop Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" />{t('shopInfo')}</CardTitle>
          {!shopEditing ? (
            <Button variant="outline" size="sm" onClick={() => setShopEditing(true)}>
              <Pencil className="h-3 w-3 mr-1" />{t('edit')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShopEditing(false); fetchShopSettings(); }}>
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSaveShop} disabled={shopSaving}>
                <Save className="h-3 w-3 mr-1" />{shopSaving ? t('saving') : t('save')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('shopName')}</Label>
              {shopEditing ? (
                <Input value={shopSettings.shop_name} onChange={e => updateShop('shop_name', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground mt-1">{shopSettings.shop_name || '-'}</p>
              )}
            </div>
            <div>
              <Label>{t('phone')}</Label>
              {shopEditing ? (
                <Input value={shopSettings.shop_phone} onChange={e => updateShop('shop_phone', e.target.value)} placeholder="+91 98765 43210" />
              ) : (
                <p className="font-medium text-foreground mt-1">{shopSettings.shop_phone || '-'}</p>
              )}
            </div>
            <div>
              <Label>{t('shopEmail')}</Label>
              {shopEditing ? (
                <Input type="email" value={shopSettings.shop_email} onChange={e => updateShop('shop_email', e.target.value)} placeholder="shop@example.com" />
              ) : (
                <p className="font-medium text-foreground mt-1">{shopSettings.shop_email || '-'}</p>
              )}
            </div>
            <div>
              <Label>{t('gstNumber')}</Label>
              {shopEditing ? (
                <Input value={shopSettings.gst_number} onChange={e => updateShop('gst_number', e.target.value)} placeholder="22AAAAA0000A1Z5" />
              ) : (
                <p className="font-medium text-foreground mt-1">{shopSettings.gst_number || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <Label>{t('address')}</Label>
            {shopEditing ? (
              <Textarea value={shopSettings.shop_address} onChange={e => updateShop('shop_address', e.target.value)} placeholder={t('shopAddressPlaceholder')} rows={2} />
            ) : (
              <p className="font-medium text-foreground mt-1">{shopSettings.shop_address || '-'}</p>
            )}
          </div>
          <div>
            <Label>{t('shopTagline')}</Label>
            {shopEditing ? (
              <Input value={shopSettings.shop_tagline} onChange={e => updateShop('shop_tagline', e.target.value)} placeholder={t('shopTaglinePlaceholder')} />
            ) : (
              <p className="font-medium text-foreground mt-1">{shopSettings.shop_tagline || '-'}</p>
            )}
          </div>
          <Separator />
          <div>
            <Label className="text-muted-foreground text-sm">{t('accountEmail')}</Label>
            <p className="font-medium text-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {t('appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('darkMode')}</p>
              <p className="text-sm text-muted-foreground">{t('darkModeDesc')}</p>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('language')}</p>
              <p className="text-sm text-muted-foreground">{t('languageDesc')}</p>
            </div>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'gu')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="gu">ગુજરાતી</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />{t('security')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('newPassword')}</Label>
            <Input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })} />
          </div>
          <div>
            <Label>{t('confirmPassword')}</Label>
            <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? t('saving') : t('changePassword')}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t('dangerZone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{t('logoutDesc')}</p>
          <Button variant="destructive" onClick={signOut}>{t('logout')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
