import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier { id: string; name: string; phone: string | null; address: string | null; gst_number: string | null; }

const emptyForm = { name: '', phone: '', address: '', gst_number: '' };

export default function Suppliers() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    setSuppliers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({ name: s.name, phone: s.phone || '', address: s.address || '', gst_number: s.gst_number || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('nameRequired')); return; }
    const payload = { name: form.name.trim(), phone: form.phone.trim() || null, address: form.address.trim() || null, gst_number: form.gst_number.trim() || null };

    if (editingId) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(t('supplierUpdated'));
    } else {
      const { error } = await supabase.from('suppliers').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t('supplierAdded'));
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('supplierDeleted'));
    fetchData();
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('suppliers')} subtitle="Your trusted business partners" emoji="🚚" icon={<Truck className="h-6 w-6" />} actions={<><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('addSupplier')}</Button></>} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('searchSuppliers')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('gstNumber')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('address')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.gst_number || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{s.address || '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('noSuppliers')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? t('editSupplier') : t('addSupplier')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>{t('name')} *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>{t('gstNumber')}</Label><Input value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} /></div>
            <div><Label>{t('address')}</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full">{editingId ? t('update') : t('add')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
