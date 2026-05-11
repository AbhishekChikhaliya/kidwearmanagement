import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Users, UserCircle, TrendingUp, Warehouse,
  Wallet, RotateCcw, Receipt, BarChart3, PieChart, FileText, Settings, Plus, Sparkles,
} from 'lucide-react';

interface SearchHit {
  id: string;
  label: string;
  sub?: string;
  to: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setHits([]); return; }
    const q = `%${query}%`;
    let cancelled = false;
    (async () => {
      const [p, c, s] = await Promise.all([
        supabase.from('products').select('id,name,barcode').ilike('name', q).limit(5),
        supabase.from('customers').select('id,name,phone').ilike('name', q).limit(5),
        supabase.from('suppliers').select('id,name,phone').ilike('name', q).limit(5),
      ]);
      if (cancelled) return;
      const out: SearchHit[] = [];
      (p.data || []).forEach((r: any) => out.push({ id: 'p' + r.id, label: r.name, sub: r.barcode || 'Product', to: '/products' }));
      (c.data || []).forEach((r: any) => out.push({ id: 'c' + r.id, label: r.name, sub: r.phone || 'Customer', to: '/customers' }));
      (s.data || []).forEach((r: any) => out.push({ id: 's' + r.id, label: r.name, sub: r.phone || 'Supplier', to: '/suppliers' }));
      setHits(out);
    })();
    return () => { cancelled = true; };
  }, [query, open]);

  const go = (to: string) => { setOpen(false); setQuery(''); navigate(to); };

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), to: '/' },
    { icon: Package, label: t('products'), to: '/products' },
    { icon: Tags, label: t('categories'), to: '/categories' },
    { icon: ShoppingCart, label: t('orders'), to: '/orders' },
    { icon: Users, label: t('suppliers'), to: '/suppliers' },
    { icon: UserCircle, label: t('customers'), to: '/customers' },
    { icon: TrendingUp, label: t('sales'), to: '/sales' },
    { icon: Warehouse, label: t('inventory'), to: '/inventory' },
    { icon: Wallet, label: t('expenses'), to: '/expenses' },
    { icon: RotateCcw, label: t('returnsRefunds'), to: '/returns' },
    { icon: Receipt, label: t('billUpload'), to: '/bill-upload' },
    { icon: BarChart3, label: t('salesDashboard'), to: '/sales-dashboard' },
    { icon: PieChart, label: t('financialDashboard'), to: '/financial-dashboard' },
    { icon: FileText, label: t('reports'), to: '/reports' },
    { icon: Settings, label: t('settings'), to: '/settings' },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search products, customers, suppliers… or jump to a page" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm">Type to search or press ↵ on a suggestion</span>
          </div>
        </CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {hits.map((h) => (
                <CommandItem key={h.id} value={h.id + h.label} onSelect={() => go(h.to)}>
                  <Sparkles className="text-primary" />
                  <div className="flex flex-col">
                    <span>{h.label}</span>
                    {h.sub && <span className="text-xs text-muted-foreground">{h.sub}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go('/products')}><Plus />Add product</CommandItem>
          <CommandItem onSelect={() => go('/sales')}><Plus />New sale</CommandItem>
          <CommandItem onSelect={() => go('/bill-upload')}><Plus />Upload bill (AI)</CommandItem>
          <CommandItem onSelect={() => go('/expenses')}><Plus />Record expense</CommandItem>
        </CommandGroup>
        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {navItems.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(n.to)}>
              <n.icon />{n.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
