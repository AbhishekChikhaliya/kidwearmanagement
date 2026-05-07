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
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';

interface Category { id: string; name: string; name_gu: string | null; icon: string | null; created_at: string; }

const emptyForm = { name: '', name_gu: '', icon: '' };

export default function Categories() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, name_gu: c.name_gu || '', icon: c.icon || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('nameRequired')); return; }
    const payload = { name: form.name.trim(), name_gu: form.name_gu.trim() || null, icon: form.icon.trim() || null };

    if (editingId) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(t('categoryUpdated'));
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t('categoryAdded'));
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('categoryDeleted'));
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('categories')} subtitle="Organize your product catalog" emoji="🏷️" icon={<Tags className="h-6 w-6" />} actions={<><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{t('addCategory')}</Button></>} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('icon')}</TableHead>
                <TableHead>{t('nameEn')}</TableHead>
                <TableHead>{t('nameGu')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-xl">{c.icon || '📦'}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.name_gu || '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('noCategories')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? t('editCategory') : t('addCategory')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>{t('nameEn')} *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>{t('nameGu')}</Label><Input value={form.name_gu} onChange={e => setForm({...form, name_gu: e.target.value})} /></div>
            <div><Label>{t('icon')} (emoji)</Label><Input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="👕" /></div>
            <Button onClick={handleSave} className="w-full">{editingId ? t('update') : t('add')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
