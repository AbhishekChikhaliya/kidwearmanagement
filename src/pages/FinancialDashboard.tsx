import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Wallet, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(330, 81%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)', 'hsl(180, 60%, 45%)', 'hsl(45, 90%, 50%)'];

export default function FinancialDashboard() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, margin: 0, refunds: 0 });
  const [monthlyPL, setMonthlyPL] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<{ current: any; previous: any }>({ current: {}, previous: {} });

  useEffect(() => { fetchData(); }, [language]);

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [salesRes, expensesRes, returnsRes] = await Promise.all([
      supabase.from('sales').select('sale_date, quantity, discount, products(retail_price, wholesale_price)').gte('sale_date', sixMonthsAgo).order('sale_date'),
      supabase.from('expenses').select('expense_date, amount, category').gte('expense_date', sixMonthsAgo),
      supabase.from('returns').select('return_date, refund_amount').gte('return_date', sixMonthsAgo),
    ]);

    const sales = salesRes.data || [];
    const expenses = expensesRes.data || [];
    const returns = returnsRes.data || [];

    // Monthly P&L breakdown
    const monthMap: Record<string, { month: string; revenue: number; cogs: number; expenses: number; refunds: number }> = {};
    const monthNames = language === 'gu'
      ? ['જાન', 'ફેબ', 'માર્ચ', 'એપ્રિ', 'મે', 'જૂન', 'જુલા', 'ઓગ', 'સપ્ટે', 'ઓક્ટો', 'નવે', 'ડિસે']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: monthNames[d.getMonth()], revenue: 0, cogs: 0, expenses: 0, refunds: 0 };
    }

    sales.forEach((s: any) => {
      const key = s.sale_date.substring(0, 7);
      if (monthMap[key]) {
        monthMap[key].revenue += (s.products?.retail_price || 0) * s.quantity - (s.discount || 0);
        monthMap[key].cogs += (s.products?.wholesale_price || 0) * s.quantity;
      }
    });
    expenses.forEach((e: any) => {
      const key = e.expense_date.substring(0, 7);
      if (monthMap[key]) monthMap[key].expenses += Number(e.amount);
    });
    returns.forEach((r: any) => {
      const key = r.return_date.substring(0, 7);
      if (monthMap[key]) monthMap[key].refunds += Number(r.refund_amount);
    });

    const plData = Object.values(monthMap).map(m => ({
      ...m,
      grossProfit: m.revenue - m.cogs,
      netProfit: m.revenue - m.cogs - m.expenses - m.refunds,
    }));
    setMonthlyPL(plData);

    // Current period summary
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const cur = monthMap[currentKey] || { revenue: 0, cogs: 0, expenses: 0, refunds: 0 };
    const grossProfit = cur.revenue - cur.cogs;
    const netProfit = grossProfit - cur.expenses - cur.refunds;
    setSummary({
      revenue: cur.revenue,
      cogs: cur.cogs,
      grossProfit,
      expenses: cur.expenses,
      netProfit,
      margin: cur.revenue > 0 ? Math.round((netProfit / cur.revenue) * 100) : 0,
      refunds: cur.refunds,
    });

    // Previous month comparison
    const prevKey = `${new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear()}-${String(new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1).padStart(2, '0')}`;
    const prev = monthMap[prevKey] || { revenue: 0, cogs: 0, expenses: 0, refunds: 0 };
    setMonthlyComparison({
      current: { revenue: cur.revenue, profit: netProfit },
      previous: { revenue: prev.revenue, profit: prev.revenue - prev.cogs - prev.expenses - prev.refunds },
    });

    // Expense breakdown
    const expCatMap: Record<string, number> = {};
    expenses.filter((e: any) => e.expense_date.startsWith(currentKey)).forEach((e: any) => {
      const cat = e.category || 'other';
      expCatMap[cat] = (expCatMap[cat] || 0) + Number(e.amount);
    });
    setExpenseBreakdown(Object.entries(expCatMap).map(([name, value]) => ({ name: t(name as any), value })));

    setLoading(false);
  };

  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const revChange = pctChange(monthlyComparison.current.revenue, monthlyComparison.previous.revenue);
  const profitChange = pctChange(monthlyComparison.current.profit, monthlyComparison.previous.profit);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('financialDashboard')} subtitle="Profit, expenses & cashflow at a glance" emoji="💰" icon={<TrendingUp className="h-6 w-6" />} />
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinCard icon={<IndianRupee className="h-5 w-5" />} label={t('monthlyRevenue')} value={`₹${summary.revenue.toLocaleString()}`} change={revChange} />
        <FinCard icon={<TrendingUp className="h-5 w-5" />} label={t('grossProfit')} value={`₹${summary.grossProfit.toLocaleString()}`} />
        <FinCard icon={<Wallet className="h-5 w-5" />} label={t('netProfit')} value={`₹${summary.netProfit.toLocaleString()}`} change={profitChange} alert={summary.netProfit < 0} />
        <FinCard icon={<Percent className="h-5 w-5" />} label={t('profitMargin')} value={`${summary.margin}%`} />
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('plStatement')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-medium">{t('totalRevenue')}</TableCell><TableCell className="text-right font-bold text-foreground">₹{summary.revenue.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-muted-foreground">− {t('costOfGoods')}</TableCell><TableCell className="text-right text-muted-foreground">₹{summary.cogs.toLocaleString()}</TableCell></TableRow>
              <TableRow className="border-t-2"><TableCell className="font-bold">{t('grossProfit')}</TableCell><TableCell className="text-right font-bold text-foreground">₹{summary.grossProfit.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-muted-foreground">− {t('operatingExpenses')}</TableCell><TableCell className="text-right text-muted-foreground">₹{summary.expenses.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium text-muted-foreground">− {t('totalRefunds')}</TableCell><TableCell className="text-right text-muted-foreground">₹{summary.refunds.toLocaleString()}</TableCell></TableRow>
              <TableRow className="border-t-2 bg-muted/50">
                <TableCell className="font-bold text-lg">{t('netProfit')}</TableCell>
                <TableCell className={`text-right font-bold text-lg ${summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  ₹{summary.netProfit.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly P&L Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('monthlyPLTrend')}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPL}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name={t('revenue')} fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name={t('netProfit')} fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('expenseBreakdown')}</CardTitle></CardHeader>
          <CardContent className="h-72">
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted-foreground">{t('noExpenses')}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Margin Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('marginTrend')}</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyPL.map(m => ({ ...m, margin: m.revenue > 0 ? Math.round((m.netProfit / m.revenue) * 100) : 0 }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="margin" name={t('profitMargin')} stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card></>} />
  );
}

function FinCard({ icon, label, value, change, alert }: { icon: React.ReactNode; label: string; value: string; change?: number; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>{icon}</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-xs font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
