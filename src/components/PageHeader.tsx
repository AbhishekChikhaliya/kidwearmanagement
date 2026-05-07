import React from 'react';
import pagePattern from '@/assets/page-pattern.jpg';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emoji?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, emoji, actions }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-pink-500/10 to-purple-500/10 p-5 md:p-7 mb-6 card-glow animate-fade-in">
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${pagePattern})` }}
        aria-hidden="true"
      />
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-float" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-sm hover:scale-110 transition-transform">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              {title} {emoji && <span className="inline-block animate-float">{emoji}</span>}
            </h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
