import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickActionsFab } from '@/components/QuickActionsFab';
import { Search } from 'lucide-react';
import kidsBanner from '@/assets/kids-banner.jpg';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-gradient-to-r from-primary/10 via-card to-primary/5 backdrop-blur px-4 sticky top-0 z-30">
            <SidebarTrigger className="ml-0" />
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background/60 text-sm text-muted-foreground hover:bg-accent transition-colors flex-1 max-w-md mx-4"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search products, customers…</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">⌘K</kbd>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                className="gap-1 hover:scale-105 transition-transform"
              >
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'ગુજરાતી' : 'English'}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:scale-110 transition-transform">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={signOut} className="hover:scale-110 transition-transform">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background relative">
            {/* Decorative kids banner strip */}
            <div
              className="h-24 md:h-32 w-full bg-cover bg-center opacity-90 border-b"
              style={{ backgroundImage: `url(${kidsBanner})` }}
              aria-hidden="true"
            />
            <div className="p-4 md:p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
        <QuickActionsFab />
      </div>
    </SidebarProvider>
  );
}
