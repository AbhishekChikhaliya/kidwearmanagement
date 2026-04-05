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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  sale_date: string;
  products?: { name: string; retail_price: number } | null;
}

interface Product { id: string; name: string; stock_quantity: number; retail_price: number; }

export default function Sales() {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: 1, sale_date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    const [s, p] = await Promise.all([
      supabase.from('sales').select('*, products(name, retail_price)').order('sale_date', { ascending: false }).limit(100),
      supabase.from('products').select('id, name, stock_quantity, retail_price').order('name'),
    ]);
    setSales((s.data as Sale[]) || []);
    setProducts(p.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSale = async () => {
    if (!form.product_id) { toast.error(t('selectProduct')); return; }
    if (form.quantity < 1) { toast.error(t('invalidQuantity')); return; }

    const product = products.find(p => p.id === form.product_id);
    if (product && form.quantity > product.stock_quantity) {
      toast.error(t('insufficientStock'));
      return;
    }

    // Insert sale
    const { error: saleErr } = await supabase.from('sales').insert({
      product_id: form.product_id,
      quantity: form.quantity,
      sale_date: form.sale_date,
    });
    if (saleErr) { toast.error(saleErr.message); return; }

    // Reduce stock
    if (product) {
      await supabase.from('products').update({
        stock_quantity: product.stock_quantity - form.quantity,
      }).eq('id', form.product_id);
    }

    // Log inventory
    await supabase.from('inventory_logs').insert({
      product_id: form.product_id,
      type: 'sold' as const,
      quantity: form.quantity,
      notes: `Sale on ${form.sale_date}`,
    });

    toast.success(t('saleRecorded'));
    setDialogOpen(false);
    setForm({ product_id: '', quantity: 1, sale_date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm(t('confirmDelete'))) return;
    // Restore stock
    const product = products.find(p => p.id === sale.product_id);
    if (product) {
      await supabase.from('products').update({
        stock_quantity: product.stock_quantity + sale.quantity,
      }).eq('id', sale.product_id);
    }
    const { error } = await supabase.from('sales').delete().eq('id', sale.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('saleDeleted'));
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('sales')}</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('recordSale')}</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.sale_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{s.products?.name || '-'}</TableCell>
                  <TableCell><Badge variant="secondary">{s.quantity} {t('pieces')}</Badge></TableCell>
                  <TableCell>₹{((s.products?.retail_price || 0) * s.quantity).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('noSales')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('recordSale')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>{t('product')} *</Label>
              <Select value={form.product_id} onValueChange={v => setForm({...form, product_id: v})}>
                <SelectTrigger><SelectValue placeholder={t('selectProduct')} /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground">({t('stock')}: {p.stock_quantity})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('quantity')} *</Label><Input type="number" min={1} value={form.quantity} onChange={e => setForm({...form, quantity: +e.target.value})} /></div>
            <div><Label>{t('date')}</Label><Input type="date" value={form.sale_date} onChange={e => setForm({...form, sale_date: e.target.value})} /></div>
            {form.product_id && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <span className="text-muted-foreground">{t('amount')}: </span>
                <span className="font-bold text-foreground">₹{((products.find(p => p.id === form.product_id)?.retail_price || 0) * form.quantity).toLocaleString()}</span>
              </div>
            )}
            <Button onClick={handleSale} className="w-full">{t('recordSale')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
