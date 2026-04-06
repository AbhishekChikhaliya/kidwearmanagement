import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Globe, Lock, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

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
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>

      {/* Shop Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" />{t('shopInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-sm">{t('shopName')}</Label>
            <p className="font-medium text-foreground">KidWear Retail</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">{t('email')}</Label>
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
