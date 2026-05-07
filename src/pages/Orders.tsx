import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, CheckCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  supplier_id: string | null;
  product_id: string | null;
  quantity: number;
  order_date: string;
  expected_delivery: string | null;
  status: 'ordered' | 'received' | 'pending';
  products?: { name: string } | null;
  suppliers?: { name: string } | null;
}

interface Product { id: string; name: string; stock_quantity: number; }
interface Supplier { id: string; name: string; }

export default function Orders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '', product_id: '', quantity: 1,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
  });

  const fetchData = async () => {
    const [o, p, s] = await Promise.all([
      supabase.from('purchase_orders').select('*, products(name), suppliers(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, stock_quantity').order('name'),
      supabase.from('suppliers').select('id, name').order('name'),
    ]);
    setOrders((o.data as Order[]) || []);
    setProducts(p.data || []);
    setSuppliers(s.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.product_id || !form.supplier_id) { toast.error(t('selectProductSupplier')); return; }
    const { error } = await supabase.from('purchase_orders').insert({
      supplier_id: form.supplier_id,
      product_id: form.product_id,
      quantity: form.quantity,
      order_date: form.order_date,
      expected_delivery: form.expected_delivery || null,
      status: 'ordered' as const,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t('orderCreated'));
    setDialogOpen(false);
    setForm({ supplier_id: '', product_id: '', quantity: 1, order_date: new Date().toISOString().split('T')[0], expected_delivery: '' });
    fetchData();
  };

  const handleReceive = async (order: Order) => {
    // Mark as received
    const { error } = await supabase.from('purchase_orders').update({ status: 'received' as const }).eq('id', order.id);
    if (error) { toast.error(error.message); return; }

    // Add stock
    if (order.product_id) {
      const product = products.find(p => p.id === order.product_id);
      if (product) {
        await supabase.from('products').update({
          stock_quantity: product.stock_quantity + order.quantity,
        }).eq('id', order.product_id);
      }

      // Log inventory
      await supabase.from('inventory_logs').insert({
        product_id: order.product_id,
        type: 'added' as const,
        quantity: order.quantity,
        notes: `Received from PO ${order.id.slice(0, 8)}`,
      });
    }

    toast.success(t('orderReceived'));
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('orderDeleted'));
    fetchData();
  };

  const statusBadge = (status: string) => {
    const variant = status === 'received' ? 'default' : status === 'pending' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{t(status as 'ordered' | 'received' | 'pending')}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('orders')} subtitle="Manage purchase orders to suppliers" emoji="📦" icon={<ClipboardList className="h-6 w-6" />} actions={<><Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('createOrder')}</Button></>} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('product')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('supplier')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('expectedDelivery')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell>{new Date(o.order_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{o.products?.name || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{o.suppliers?.name || '-'}</TableCell>
                  <TableCell>{o.quantity} {t('pieces')}</TableCell>
                  <TableCell>{statusBadge(o.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {o.status !== 'received' && (
                      <Button variant="ghost" size="icon" onClick={() => handleReceive(o)} title={t('markReceived')}>
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('noOrders')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('createOrder')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>{t('supplier')} *</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm({...form, supplier_id: v})}>
                <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('product')} *</Label>
              <Select value={form.product_id} onValueChange={v => setForm({...form, product_id: v})}>
                <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t('quantity')}</Label><Input type="number" min={1} value={form.quantity} onChange={e => setForm({...form, quantity: +e.target.value})} /></div>
            <div><Label>{t('orderDate')}</Label><Input type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} /></div>
            <div><Label>{t('expectedDelivery')}</Label><Input type="date" value={form.expected_delivery} onChange={e => setForm({...form, expected_delivery: e.target.value})} /></div>
            <Button onClick={handleCreate} className="w-full">{t('createOrder')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
