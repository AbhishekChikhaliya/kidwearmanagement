import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('resetEmailSent'));
        setIsForgotPassword(false);
      }
      return;
    }

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success(t('checkEmailConfirm'));
    }
  };

  const getButtonText = () => {
    if (loading) {
      if (isForgotPassword) return t('sendingResetLink');
      return isSignUp ? t('signingUp') : t('signingIn');
    }
    if (isForgotPassword) return t('sendResetLink');
    return isSignUp ? t('signUp') : t('signIn');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t('appName')}</CardTitle>
          <CardDescription>
            {isForgotPassword ? t('forgotPasswordDesc') : t('appTagline')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isForgotPassword && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {getButtonText()}
            </Button>
          </form>

          {!isSignUp && !isForgotPassword && (
            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-primary underline hover:text-primary/80"
              >
                {t('forgotPassword')}
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-primary underline"
              >
                {t('backToLogin')}
              </button>
            ) : (
              <>
                {isSignUp ? t('haveAccount') : t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary underline"
                >
                  {isSignUp ? t('signIn') : t('signUp')}
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
