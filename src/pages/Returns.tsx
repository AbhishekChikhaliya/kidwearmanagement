import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Return {
  id: string;
  sale_id: string | null;
  product_id: string;
  customer_id: string | null;
  quantity: number;
  reason: string | null;
  refund_amount: number;
  return_date: string;
  created_at: string;
  products?: { name: string; retail_price: number } | null;
  customers?: { name: string } | null;
}

interface Product { id: string; name: string; retail_price: number; stock_quantity: number; }
interface Customer { id: string; name: string; }

export default function Returns() {
  const { t } = useLanguage();
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', customer_id: '', quantity: 1, reason: '', refund_amount: 0 });

  const fetchData = async () => {
    const [r, p, c] = await Promise.all([
      supabase.from('returns').select('*, products(name, retail_price), customers(name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('products').select('id, name, retail_price, stock_quantity').order('name'),
      supabase.from('customers').select('id, name').order('name'),
    ]);
    setReturns((r.data as Return[]) || []);
    setProducts(p.data || []);
    setCustomers(c.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setForm({ ...form, product_id: productId, refund_amount: product ? product.retail_price : 0 });
  };

  const handleReturn = async () => {
    if (!form.product_id) { toast.error(t('selectProduct')); return; }
    if (form.quantity < 1) { toast.error(t('invalidQuantity')); return; }

    const product = products.find(p => p.id === form.product_id);
    if (!product) return;

    // Insert return record
    const { error } = await supabase.from('returns').insert({
      product_id: form.product_id,
      customer_id: form.customer_id || null,
      quantity: form.quantity,
      reason: form.reason || null,
      refund_amount: form.refund_amount * form.quantity,
    });
    if (error) { toast.error(error.message); return; }

    // Restore stock
    await supabase.from('products').update({
      stock_quantity: product.stock_quantity + form.quantity,
    }).eq('id', form.product_id);

    // Log inventory
    await supabase.from('inventory_logs').insert({
      product_id: form.product_id,
      type: 'added' as const,
      quantity: form.quantity,
      notes: `Return: ${form.reason || 'No reason'}`,
    });

    toast.success(t('returnProcessed'));
    setDialogOpen(false);
    setForm({ product_id: '', customer_id: '', quantity: 1, reason: '', refund_amount: 0 });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('returns').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('returnDeleted'));
    fetchData();
  };

  const totalRefunds = returns.reduce((sum, r) => sum + Number(r.refund_amount), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('returnsRefunds')}</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('processReturn')}</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('totalRefunds')}</p>
              <p className="text-xl font-bold text-foreground">₹{totalRefunds.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('product')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('customer')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('refundAmount')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('reason')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{new Date(r.return_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{r.products?.name || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.customers?.name || '-'}</TableCell>
                  <TableCell><Badge variant="secondary">{r.quantity} {t('pieces')}</Badge></TableCell>
                  <TableCell className="text-destructive font-medium">₹{Number(r.refund_amount).toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">{r.reason || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {returns.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('noReturns')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('processReturn')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>{t('product')} *</Label>
              <Select value={form.product_id} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder={t('selectProduct')} /></SelectTrigger>
                <SelectContent>{products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.retail_price})</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('customer')}</Label>
              <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder={t('selectCustomer')} /></SelectTrigger>
                <SelectContent>{customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('quantity')}</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
              </div>
              <div>
                <Label>{t('refundPerPiece')}</Label>
                <Input type="number" min={0} value={form.refund_amount} onChange={e => setForm({ ...form, refund_amount: +e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t('reason')}</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder={t('returnReasonPlaceholder')} />
            </div>
            <div className="p-3 rounded-lg bg-muted text-right">
              <span className="text-muted-foreground">{t('totalRefund')}: </span>
              <span className="font-bold text-lg text-foreground">₹{(form.refund_amount * form.quantity).toLocaleString()}</span>
            </div>
            <Button onClick={handleReturn} className="w-full">{t('processReturn')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
