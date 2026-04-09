import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { TrendingUp, ShoppingCart, IndianRupee, Users, CreditCard } from 'lucide-react';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(330, 81%, 60%)', 'hsl(262, 83%, 58%)'];

export default function SalesDashboard() {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0,
  });
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [weekdayData, setWeekdayData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, language]);

  const fetchData = async () => {
    setLoading(true);
    const [salesRes, customersRes] = await Promise.all([
      supabase.from('sales').select('*, products(name, retail_price, wholesale_price), customers(name)')
        .gte('sale_date', dateRange.from).lte('sale_date', dateRange.to).order('sale_date'),
      supabase.from('customers').select('id, name'),
    ]);
    const sales = salesRes.data || [];
    const customers = customersRes.data || [];

    // Metrics
    let totalRevenue = 0;
    const uniqueCustomers = new Set<string>();
    sales.forEach((s: any) => {
      const price = (s.products?.retail_price || 0) * s.quantity - (s.discount || 0);
      totalRevenue += price;
      if (s.customer_id) uniqueCustomers.add(s.customer_id);
    });
    setMetrics({
      totalRevenue,
      totalOrders: sales.length,
      avgOrderValue: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0,
      totalCustomers: uniqueCustomers.size,
    });

    // Daily trend
    const dMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    sales.forEach((s: any) => {
      if (!dMap[s.sale_date]) dMap[s.sale_date] = { date: s.sale_date, revenue: 0, orders: 0 };
      dMap[s.sale_date].revenue += (s.products?.retail_price || 0) * s.quantity - (s.discount || 0);
      dMap[s.sale_date].orders += 1;
    });
    setDailyTrend(Object.values(dMap).sort((a, b) => a.date.localeCompare(b.date)));

    // Payment mode breakdown
    const pmMap: Record<string, number> = {};
    sales.forEach((s: any) => {
      const mode = s.payment_mode || 'cash';
      pmMap[mode] = (pmMap[mode] || 0) + (s.products?.retail_price || 0) * s.quantity - (s.discount || 0);
    });
    setPaymentBreakdown(Object.entries(pmMap).map(([name, value]) => ({ name: t(name as any), value })));

    // Top products by revenue
    const prodMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s: any) => {
      const n = s.products?.name || 'Unknown';
      if (!prodMap[n]) prodMap[n] = { name: n, qty: 0, revenue: 0 };
      prodMap[n].qty += s.quantity;
      prodMap[n].revenue += (s.products?.retail_price || 0) * s.quantity;
    });
    setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10));

    // Top customers
    const custMap: Record<string, { name: string; orders: number; spent: number }> = {};
    sales.forEach((s: any) => {
      const cName = s.customers?.name || t('walkInCustomer' as any);
      const key = s.customer_id || 'walk-in';
      if (!custMap[key]) custMap[key] = { name: cName, orders: 0, spent: 0 };
      custMap[key].orders += 1;
      custMap[key].spent += (s.products?.retail_price || 0) * s.quantity - (s.discount || 0);
    });
    setTopCustomers(Object.values(custMap).sort((a, b) => b.spent - a.spent).slice(0, 5));

    // Weekday analysis
    const wdMap: Record<number, { day: string; revenue: number; orders: number }> = {};
    const dayNames = language === 'gu'
      ? ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) wdMap[i] = { day: dayNames[i], revenue: 0, orders: 0 };
    sales.forEach((s: any) => {
      const wd = new Date(s.sale_date).getDay();
      wdMap[wd].revenue += (s.products?.retail_price || 0) * s.quantity;
      wdMap[wd].orders += 1;
    });
    setWeekdayData(Object.values(wdMap));

    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('salesDashboard')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('from')}:</Label>
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} className="w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('to')}:</Label>
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} className="w-auto" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<IndianRupee className="h-5 w-5" />} label={t('totalRevenue')} value={`₹${metrics.totalRevenue.toLocaleString()}`} />
        <KPICard icon={<ShoppingCart className="h-5 w-5" />} label={t('totalOrders')} value={metrics.totalOrders} />
        <KPICard icon={<CreditCard className="h-5 w-5" />} label={t('avgOrderValue')} value={`₹${metrics.avgOrderValue.toLocaleString()}`} />
        <KPICard icon={<Users className="h-5 w-5" />} label={t('uniqueCustomers')} value={metrics.totalCustomers} />
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('revenueTrend')}</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" tickFormatter={v => new Date(v).toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis className="text-xs" />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, t('revenue')]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Payment Mode */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('paymentBreakdown')}</CardTitle></CardHeader>
          <CardContent className="h-64">
            {paymentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted-foreground">{t('noSales')}</div>}
          </CardContent>
        </Card>

        {/* Weekday Pattern */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('weekdayPattern')}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('topCustomers')}</CardTitle></CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noSales')}</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">₹{c.spent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{c.orders} {t('ordersLabel')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('topSellingProducts')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('quantitySold')}</TableHead>
                <TableHead>{t('revenue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.name}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.qty} {t('pieces')}</Badge></TableCell>
                  <TableCell className="font-medium">₹{p.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {topProducts.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('noSales')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
