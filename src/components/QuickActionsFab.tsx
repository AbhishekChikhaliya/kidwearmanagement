import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ShoppingCart, Receipt, Package, Wallet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { icon: ShoppingCart, label: 'New Sale', to: '/sales', color: 'bg-pink-500' },
  { icon: Package, label: 'Add Product', to: '/products', color: 'bg-blue-500' },
  { icon: Receipt, label: 'Upload Bill', to: '/bill-upload', color: 'bg-purple-500' },
  { icon: Wallet, label: 'Add Expense', to: '/expenses', color: 'bg-amber-500' },
];

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname === '/reset-password') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2 animate-fade-in">
          {actions.map((a) => (
            <button
              key={a.to}
              onClick={() => { setOpen(false); navigate(a.to); }}
              className="group flex items-center gap-2"
            >
              <span className="rounded-md bg-card border px-3 py-1.5 text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                {a.label}
              </span>
              <span className={cn('p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform', a.color)}>
                <a.icon className="h-5 w-5" />
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'p-4 rounded-full shadow-2xl hover:scale-110 transition-all',
          'bg-gradient-to-br from-primary via-pink-500 to-purple-500 text-white',
          open && 'rotate-45'
        )}
        aria-label="Quick actions"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
