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
  discount: number;
  payment_mode: string;
  invoice_no: string | null;
  customer_id: string | null;
  products?: { name: string; retail_price: number } | null;
  customers?: { name: string } | null;
}

interface Product { id: string; name: string; stock_quantity: number; retail_price: number; }
interface Customer { id: string; name: string; phone: string | null; }

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [customerId, setCustomerId] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ items: { name: string; quantity: number; price: number }[]; invoiceNo: string; date: string; discount?: number; customerName?: string; paymentMode?: string } | null>(null);

  const fetchData = async () => {
    const [s, p, c] = await Promise.all([
      supabase.from('sales').select('*, products(name, retail_price), customers(name)').order('sale_date', { ascending: false }).limit(100),
      supabase.from('products').select('id, name, stock_quantity, retail_price').order('name'),
      supabase.from('customers').select('id, name, phone').order('name'),
    ]);
    setSales((s.data as Sale[]) || []);
    setProducts(p.data || []);
    setCustomers(c.data || []);
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

  const removeFromCart = (productId: string) => setCart(cart.filter(c => c.product_id !== productId));

  const cartSubtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error(t('selectProduct')); return; }
    const saleDate = new Date().toISOString().split('T')[0];
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;

    for (const item of cart) {
      const { error: saleErr } = await supabase.from('sales').insert({
        product_id: item.product_id,
        quantity: item.quantity,
        sale_date: saleDate,
        discount: discount / cart.length,
        payment_mode: paymentMode,
        invoice_no: invoiceNo,
        customer_id: customerId || null,
      });
      if (saleErr) { toast.error(saleErr.message); return; }

      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase.from('products').update({
          stock_quantity: product.stock_quantity - item.quantity,
        }).eq('id', item.product_id);
      }

      await supabase.from('inventory_logs').insert({
        product_id: item.product_id,
        type: 'sold' as const,
        quantity: item.quantity,
        notes: `Sale ${invoiceNo}`,
      });
    }

    const selectedCustomer = customers.find(c => c.id === customerId);
    setInvoiceData({
      items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
      invoiceNo,
      date: new Date().toLocaleDateString(),
      discount,
      customerName: selectedCustomer?.name,
      paymentMode,
    });

    toast.success(t('saleRecorded'));
    setDialogOpen(false);
    setCart([]);
    setDiscount(0);
    setPaymentMode('cash');
    setCustomerId('');
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
                <TableHead className="hidden md:table-cell">{t('customer')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('paymentMode')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.sale_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{s.products?.name || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.customers?.name || '-'}</TableCell>
                  <TableCell><Badge variant="secondary">{s.quantity} {t('pieces')}</Badge></TableCell>
                  <TableCell>₹{((s.products?.retail_price || 0) * s.quantity - (s.discount || 0)).toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{t(s.payment_mode as any) || s.payment_mode}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('noSales')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('recordSale')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Customer selection */}
            <div>
              <Label>{t('customer')}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder={t('selectCustomer')} /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add product */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>{t('product')}</Label>
                <Select value={addProductId} onValueChange={setAddProductId}>
                  <SelectTrigger><SelectValue placeholder={t('selectProduct')} /></SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.stock_quantity > 0).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({t('stock')}: {p.stock_quantity})</SelectItem>
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

            {/* Cart */}
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('discount')} (₹)</Label>
                    <Input type="number" min={0} value={discount} onChange={e => setDiscount(+e.target.value)} />
                  </div>
                  <div>
                    <Label>{t('paymentMode')}</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t('cash')}</SelectItem>
                        <SelectItem value="upi">{t('upi')}</SelectItem>
                        <SelectItem value="card">{t('card')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('subtotal')}</span>
                    <span>₹{cartSubtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>{t('discount')}</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-foreground border-t pt-1">
                    <span>{t('total')}</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleCompleteSale} className="w-full" disabled={cart.length === 0}>
              {t('recordSale')} {cart.length > 0 && `(${cart.length} ${t('items')})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {invoiceData && (
        <SaleInvoice
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          items={invoiceData.items}
          invoiceNo={invoiceData.invoiceNo}
          date={invoiceData.date}
          discount={invoiceData.discount}
          customerName={invoiceData.customerName}
          paymentMode={invoiceData.paymentMode}
        />
      )}
    </div>
  );
}
