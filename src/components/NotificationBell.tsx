import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, Package, TrendingUp, Info, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  };

  const checkLowStock = async () => {
    const { data: products } = await supabase.from('products').select('id, name, stock_quantity, min_stock_level');
    if (!products) return;

    const lowStock = products.filter(p => p.stock_quantity <= p.min_stock_level);
    if (lowStock.length === 0) return;

    // Check if we already have a recent low-stock notification (within last hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'low_stock')
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) return;

    const names = lowStock.slice(0, 3).map(p => p.name).join(', ');
    const suffix = lowStock.length > 3 ? ` +${lowStock.length - 3} ${t('more')}` : '';

    await supabase.from('notifications').insert({
      title: t('lowStockAlert'),
      message: `${names}${suffix}`,
      type: 'low_stock',
    });

    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    checkLowStock();
    const interval = setInterval(() => {
      fetchNotifications();
      checkLowStock();
    }, 300000); // Check every 5 min
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    await Promise.all(unread.map(n =>
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    ));
    fetchNotifications();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'order': return <Package className="h-4 w-4 text-primary" />;
      case 'sale': return <TrendingUp className="h-4 w-4 text-primary" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm text-foreground">{t('notifications')}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" />{t('markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{t('noNotifications')}</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 p-3 border-b last:border-0 ${!n.is_read ? 'bg-accent/50' : ''}`}
              >
                <div className="mt-0.5">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
