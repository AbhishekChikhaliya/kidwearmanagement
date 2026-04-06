import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category_id: string | null;
  supplier_id: string | null;
  size: string | null;
  color: string | null;
  brand: string | null;
  barcode: string | null;
  wholesale_price: number;
  retail_price: number;
  stock_quantity: number;
  min_stock_level: number;
  categories?: { name: string; name_gu: string | null } | null;
  suppliers?: { name: string } | null;
}

interface Category { id: string; name: string; name_gu: string | null; }
interface Supplier { id: string; name: string; }

const emptyForm = {
  name: '', category_id: '', supplier_id: '', size: '', color: '', brand: '',
  barcode: '', wholesale_price: 0, retail_price: 0, stock_quantity: 0, min_stock_level: 5,
};

export default function Products() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const [p, c, s] = await Promise.all([
      supabase.from('products').select('*, categories(name, name_gu), suppliers(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, name_gu'),
      supabase.from('suppliers').select('id, name'),
    ]);
    setProducts((p.data as Product[]) || []);
    setCategories(c.data || []);
    setSuppliers(s.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name, category_id: p.category_id || '', supplier_id: p.supplier_id || '',
      size: p.size || '', color: p.color || '', brand: p.brand || '', barcode: p.barcode || '',
      wholesale_price: p.wholesale_price, retail_price: p.retail_price,
      stock_quantity: p.stock_quantity, min_stock_level: p.min_stock_level,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('nameRequired')); return; }
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      size: form.size || null, color: form.color || null, brand: form.brand || null,
      barcode: form.barcode || null,
      wholesale_price: Number(form.wholesale_price), retail_price: Number(form.retail_price),
      stock_quantity: Number(form.stock_quantity), min_stock_level: Number(form.min_stock_level),
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(t('productUpdated'));
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t('productAdded'));
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('productDeleted'));
    fetchData();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('products')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('addProduct')}</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('brand')}</TableHead>
                <TableHead>{t('stock')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('retailPrice')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}{p.size && <span className="text-muted-foreground text-xs ml-1">({p.size})</span>}</TableCell>
                  <TableCell className="hidden md:table-cell">{language === 'gu' ? (p.categories?.name_gu || p.categories?.name) : p.categories?.name || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.brand || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={p.stock_quantity <= p.min_stock_level ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">₹{p.retail_price}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('noProducts')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t('editProduct') : t('addProduct')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>{t('name')} *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('category')}</Label>
                <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{language === 'gu' ? (c.name_gu || c.name) : c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('supplier')}</Label>
                <Select value={form.supplier_id} onValueChange={v => setForm({...form, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>{t('size')}</Label><Input value={form.size} onChange={e => setForm({...form, size: e.target.value})} /></div>
              <div><Label>{t('color')}</Label><Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
              <div><Label>{t('brand')}</Label><Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
            </div>
            <div>
              <Label>{t('barcode')}</Label>
              <div className="flex gap-2">
                <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const code = 'KW' + Date.now().toString().slice(-10);
                  setForm({...form, barcode: code});
                  toast.success(t('barcodeGenerated'));
                }}>{t('generateBarcode')}</Button>
              </div>
              {form.barcode && (
                <div className="mt-2 p-2 bg-muted rounded text-center font-mono text-lg tracking-widest text-foreground">
                  {form.barcode}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('wholesalePrice')}</Label><Input type="number" value={form.wholesale_price} onChange={e => setForm({...form, wholesale_price: +e.target.value})} /></div>
              <div><Label>{t('retailPrice')}</Label><Input type="number" value={form.retail_price} onChange={e => setForm({...form, retail_price: +e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('stockQuantity')}</Label><Input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: +e.target.value})} /></div>
              <div><Label>{t('minStockLevel')}</Label><Input type="number" value={form.min_stock_level} onChange={e => setForm({...form, min_stock_level: +e.target.value})} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? t('update') : t('add')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
