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
import { SaleInvoice } from '@/components/SaleInvoice';

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  sale_date: string;
  products?: { name: string; retail_price: number } | null;
}

interface Product { id: string; name: string; stock_quantity: number; retail_price: number; }

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  max_stock: number;
}

export default function Sales() {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  // Invoice
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ items: { name: string; quantity: number; price: number }[]; invoiceNo: string; date: string } | null>(null);

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

  const addToCart = () => {
    if (!addProductId) return;
    const product = products.find(p => p.id === addProductId);
    if (!product) return;
    if (addQty < 1) { toast.error(t('invalidQuantity')); return; }
    if (addQty > product.stock_quantity) { toast.error(t('insufficientStock')); return; }

    const existing = cart.find(c => c.product_id === addProductId);
    if (existing) {
      setCart(cart.map(c => c.product_id === addProductId ? { ...c, quantity: c.quantity + addQty } : c));
    } else {
      setCart([...cart, { product_id: addProductId, name: product.name, quantity: addQty, price: product.retail_price, max_stock: product.stock_quantity }]);
    }
    setAddProductId('');
    setAddQty(1);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product_id !== productId));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error(t('selectProduct')); return; }

    const saleDate = new Date().toISOString().split('T')[0];
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;

    for (const item of cart) {
      // Insert sale
      const { error: saleErr } = await supabase.from('sales').insert({
        product_id: item.product_id,
        quantity: item.quantity,
        sale_date: saleDate,
      });
      if (saleErr) { toast.error(saleErr.message); return; }

      // Reduce stock
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase.from('products').update({
          stock_quantity: product.stock_quantity - item.quantity,
        }).eq('id', item.product_id);
      }

      // Log inventory
      await supabase.from('inventory_logs').insert({
        product_id: item.product_id,
        type: 'sold' as const,
        quantity: item.quantity,
        notes: `Sale ${invoiceNo}`,
      });
    }

    // Show invoice
    setInvoiceData({
      items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
      invoiceNo,
      date: new Date().toLocaleDateString(),
    });

    toast.success(t('saleRecorded'));
    setDialogOpen(false);
    setCart([]);
    setInvoiceOpen(true);
    fetchData();
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm(t('confirmDelete'))) return;
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

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

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

      {/* Multi-item Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('recordSale')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Add product to cart */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>{t('product')}</Label>
                <Select value={addProductId} onValueChange={setAddProductId}>
                  <SelectTrigger><SelectValue placeholder={t('selectProduct')} /></SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.stock_quantity > 0).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({t('stock')}: {p.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label>{t('quantity')}</Label>
                <Input type="number" min={1} value={addQty} onChange={e => setAddQty(+e.target.value)} />
              </div>
              <Button onClick={addToCart} size="sm">{t('add')}</Button>
            </div>

            {/* Cart items */}
            {cart.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('product')}</TableHead>
                      <TableHead>{t('quantity')}</TableHead>
                      <TableHead>{t('amount')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{(item.price * item.quantity).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product_id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {cart.length > 0 && (
              <div className="p-3 rounded-lg bg-muted text-right">
                <span className="text-muted-foreground">{t('amount')}: </span>
                <span className="font-bold text-lg text-foreground">₹{cartTotal.toLocaleString()}</span>
              </div>
            )}

            <Button onClick={handleCompleteSale} className="w-full" disabled={cart.length === 0}>
              {t('recordSale')} {cart.length > 0 && `(${cart.length} ${t('items')})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      {invoiceData && (
        <SaleInvoice
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          items={invoiceData.items}
          invoiceNo={invoiceData.invoiceNo}
          date={invoiceData.date}
        />
      )}
    </div>
  );
}
