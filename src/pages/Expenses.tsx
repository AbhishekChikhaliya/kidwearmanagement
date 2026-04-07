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
import { Plus, Trash2, Wallet, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = ['rent', 'salary', 'utilities', 'transport', 'packaging', 'marketing', 'maintenance', 'other'] as const;

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
}

export default function Expenses() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [form, setForm] = useState({
    category: 'other' as string,
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', dateRange.from)
      .lte('expense_date', dateRange.to)
      .order('expense_date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const handleSave = async () => {
    if (form.amount <= 0) { toast.error(t('invalidAmount')); return; }
    const { error } = await supabase.from('expenses').insert({
      category: form.category as any,
      amount: form.amount,
      description: form.description || null,
      expense_date: form.expense_date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t('expenseAdded'));
    setDialogOpen(false);
    setForm({ category: 'other', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('expenseDeleted'));
    fetchData();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      rent: 'destructive', salary: 'default', utilities: 'secondary',
      transport: 'outline', packaging: 'secondary', marketing: 'default',
      maintenance: 'destructive', other: 'secondary',
    };
    return colors[cat] || 'secondary';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('expenses')}</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('addExpense')}</Button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm">{t('from')}:</Label>
          <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">{t('to')}:</Label>
          <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-auto" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive"><Wallet className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('totalExpenses')}</p>
                <p className="text-xl font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).slice(0, 3).map(([cat, total]) => (
          <Card key={cat}>
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t(cat as any)}</p>
                <p className="text-lg font-bold text-foreground">₹{total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('description')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={categoryColor(e.category) as any}>{t(e.category as any)}</Badge></TableCell>
                  <TableCell className="font-medium">₹{Number(e.amount).toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">{e.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t('noExpenses')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('addExpense')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>{t('category')}</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{t(c as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('amount')} (₹) *</Label><Input type="number" min={0} value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} /></div>
            <div><Label>{t('date')}</Label><Input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} /></div>
            <div><Label>{t('description')}</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder={t('optionalNotes')} /></div>
            <Button onClick={handleSave} className="w-full">{t('add')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
