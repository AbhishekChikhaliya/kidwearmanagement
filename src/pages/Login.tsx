import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Eye, EyeOff, Sparkles, ShoppingBag, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import loginHero from '@/assets/login-hero.jpg';

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
    <div className="relative min-h-screen flex bg-background overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Left: Hero image panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative">
        <img
          src={loginHero}
          alt="Children's clothing boutique"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground animate-fade-in">
          <Sparkles className="h-10 w-10 mb-4 animate-float" />
          <h2 className="text-4xl font-bold mb-3">{t('appName')}</h2>
          <p className="text-lg opacity-90 mb-8 max-w-md">{t('appTagline')}</p>
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-sm">Smart inventory & POS</span>
            </div>
            <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-sm">Real-time sales analytics</span>
            </div>
            <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-sm">AI-powered bill scanning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg animate-float">
              <Package className="h-7 w-7 text-primary-foreground" />
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
