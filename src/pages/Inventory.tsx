import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryLog {
  id: string;
  product_id: string;
  type: 'added' | 'sold' | 'adjusted';
  quantity: number;
  notes: string | null;
  created_at: string;
  products?: { name: string } | null;
}

interface Product { id: string; name: string; stock_quantity: number; }

export default function Inventory() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', type: 'added' as 'added' | 'sold' | 'adjusted', quantity: 1, notes: '' });

  const fetchData = async () => {
    const [l, p] = await Promise.all([
      supabase.from('inventory_logs').select('*, products(name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('products').select('id, name, stock_quantity').order('name'),
    ]);
    setLogs((l.data as InventoryLog[]) || []);
    setProducts(p.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdjust = async () => {
    if (!form.product_id) { toast.error(t('selectProduct')); return; }
    if (form.quantity < 1) { toast.error(t('invalidQuantity')); return; }

    const product = products.find(p => p.id === form.product_id);
    if (!product) return;

    let newStock = product.stock_quantity;
    if (form.type === 'added') newStock += form.quantity;
    else if (form.type === 'sold') newStock -= form.quantity;
    else newStock = form.quantity; // adjusted = set to exact value

    if (newStock < 0) { toast.error(t('insufficientStock')); return; }

    // Update stock
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', form.product_id);

    // Log
    await supabase.from('inventory_logs').insert({
      product_id: form.product_id,
      type: form.type,
      quantity: form.type === 'adjusted' ? form.quantity : form.quantity,
      notes: form.notes || null,
    });

    toast.success(t('stockAdjusted'));
    setDialogOpen(false);
    setForm({ product_id: '', type: 'added', quantity: 1, notes: '' });
    fetchData();
  };

  const typeIcon = (type: string) => {
    if (type === 'added') return <ArrowUpCircle className="h-4 w-4 text-primary" />;
    if (type === 'sold') return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
    return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { added: t('added'), sold: t('sold'), adjusted: t('adjusted') };
    return map[type] || type;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('inventoryTracking')}</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('adjustStock')}</Button>
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">{t('activityLog')}</TabsTrigger>
          <TabsTrigger value="current">{t('currentStock')}</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{new Date(l.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{l.products?.name || '-'}</TableCell>
                      <TableCell><div className="flex items-center gap-1">{typeIcon(l.type)}{typeLabel(l.type)}</div></TableCell>
                      <TableCell>{l.quantity}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">{l.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('noLogs')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('currentStock')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant={p.stock_quantity <= 5 ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('adjustStock')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>{t('product')} *</Label>
              <Select value={form.product_id} onValueChange={v => setForm({...form, product_id: v})}>
                <SelectTrigger><SelectValue placeholder={t('selectProduct')} /></SelectTrigger>
                <SelectContent>{products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({t('stock')}: {p.stock_quantity})</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('type')}</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v as 'added' | 'sold' | 'adjusted'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="added">{t('added')}</SelectItem>
                  <SelectItem value="sold">{t('sold')}</SelectItem>
                  <SelectItem value="adjusted">{t('adjusted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{form.type === 'adjusted' ? t('newStockValue') : t('quantity')}</Label><Input type="number" min={0} value={form.quantity} onChange={e => setForm({...form, quantity: +e.target.value})} /></div>
            <div><Label>{t('notes')}</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t('optionalNotes')} /></div>
            <Button onClick={handleAdjust} className="w-full">{t('adjustStock')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
