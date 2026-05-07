import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Tags, AlertTriangle, TrendingUp, Wallet, IndianRupee, ShoppingCart } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(330, 81%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)'];

interface DashboardData {
  totalProducts: number;
  totalCategories: number;
  lowStockItems: { id: string; name: string; stock_quantity: number; min_stock_level: number }[];
  todaysSales: number;
  stockByCategory: { name: string; value: number }[];
  salesTrend: { date: string; sales: number }[];
  recentOrders: { id: string; product_name: string; supplier_name: string; quantity: number; status: string; order_date: string }[];
  totalStockValue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  topProducts: { name: string; sold: number; revenue: number }[];
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0, totalCategories: 0, lowStockItems: [], todaysSales: 0,
    stockByCategory: [], salesTrend: [], recentOrders: [],
    totalStockValue: 0, monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [productsRes, categoriesRes, allProductsRes, salesTodayRes, salesTrendRes, ordersRes, monthlySalesRes, monthlyExpensesRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, stock_quantity, min_stock_level, retail_price, wholesale_price'),
        supabase.from('sales').select('quantity').eq('sale_date', today),
        supabase.from('sales').select('sale_date, quantity').gte('sale_date', sevenDaysAgo).order('sale_date'),
        supabase.from('purchase_orders').select('id, quantity, status, order_date, products(name), suppliers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('sales').select('quantity, products(name, retail_price, wholesale_price)').gte('sale_date', monthStart),
        supabase.from('expenses').select('amount').gte('expense_date', monthStart),
      ]);

      const products = allProductsRes.data || [];

      // Stock value
      const totalStockValue = products.reduce((sum, p: any) => sum + (p.retail_price || 0) * (p.stock_quantity || 0), 0);

      // Monthly revenue & profit
      const monthlySales = monthlySalesRes.data || [];
      let monthlyRevenue = 0, monthlyCost = 0;
      const prodSalesMap: Record<string, { name: string; sold: number; revenue: number }> = {};
      monthlySales.forEach((s: any) => {
        const price = s.products?.retail_price || 0;
        const cost = s.products?.wholesale_price || 0;
        monthlyRevenue += price * s.quantity;
        monthlyCost += cost * s.quantity;
        const name = s.products?.name || 'Unknown';
        if (!prodSalesMap[name]) prodSalesMap[name] = { name, sold: 0, revenue: 0 };
        prodSalesMap[name].sold += s.quantity;
        prodSalesMap[name].revenue += price * s.quantity;
      });

      const monthlyExpTotal = (monthlyExpensesRes.data || []).reduce((sum, e: any) => sum + Number(e.amount), 0);

      // Stock by category
      const { data: prodCats } = await supabase.from('products').select('stock_quantity, categories(name, name_gu)');
      const catMap: Record<string, number> = {};
      prodCats?.forEach((p: any) => {
        const catName = language === 'gu' ? (p.categories?.name_gu || p.categories?.name || 'Other') : (p.categories?.name || 'Other');
        catMap[catName] = (catMap[catName] || 0) + (p.stock_quantity || 0);
      });

      // Sales trend
      const trendMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        trendMap[d] = 0;
      }
      salesTrendRes.data?.forEach((s: any) => {
        if (trendMap[s.sale_date] !== undefined) trendMap[s.sale_date] += s.quantity;
      });

      const todayTotal = salesTodayRes.data?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;

      setData({
        totalProducts: productsRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        lowStockItems: products.filter((p: any) => p.stock_quantity <= p.min_stock_level),
        todaysSales: todayTotal,
        stockByCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })),
        salesTrend: Object.entries(trendMap).map(([date, sales]) => ({
          date: new Date(date).toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-IN', { weekday: 'short' }),
          sales,
        })),
        recentOrders: (ordersRes.data || []).map((o: any) => ({
          id: o.id, product_name: o.products?.name || '-', supplier_name: o.suppliers?.name || '-',
          quantity: o.quantity, status: o.status, order_date: o.order_date,
        })),
        totalStockValue,
        monthlyRevenue,
        monthlyExpenses: monthlyExpTotal,
        monthlyProfit: monthlyRevenue - monthlyCost - monthlyExpTotal,
        topProducts: Object.values(prodSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      });
      setLoading(false);
    }
    fetchDashboard();
  }, [language]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const statusLabel = (s: string) => t(s as 'ordered' | 'received' | 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-pink-500/10 to-purple-500/10 p-6 md:p-8 border card-glow">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">{t('dashboard')} ✨</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your shop at a glance.</p>
        </div>
      </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<IndianRupee className="h-5 w-5" />} label={t('monthlyRevenue')} value={`₹${data.monthlyRevenue.toLocaleString()}`} />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label={t('netProfit')} value={`₹${data.monthlyProfit.toLocaleString()}`} alert={data.monthlyProfit < 0} />
        <SummaryCard icon={<Package className="h-5 w-5" />} label={t('totalStockValue')} value={`₹${data.totalStockValue.toLocaleString()}`} />
        <SummaryCard icon={<Wallet className="h-5 w-5" />} label={t('monthlyExpenses')} value={`₹${data.monthlyExpenses.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Package className="h-5 w-5" />} label={t('totalProducts')} value={data.totalProducts} />
        <SummaryCard icon={<Tags className="h-5 w-5" />} label={t('totalCategories')} value={data.totalCategories} />
        <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label={t('lowStockItems')} value={data.lowStockItems.length} alert={data.lowStockItems.length > 0} />
        <SummaryCard icon={<ShoppingCart className="h-5 w-5" />} label={t('todaysSales')} value={`${data.todaysSales} ${t('pieces')}`} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('stockDistribution')}</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.stockByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.stockByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('salesTrend')}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling + Low Stock + Recent Orders */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('topSellingProducts')}</CardTitle></CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noSales')}</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">₹{p.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.sold} {t('pieces')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{t('lowStockAlerts')}</CardTitle></CardHeader>
          <CardContent>
            {data.lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noLowStock')}</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <Badge variant="destructive">{item.stock_quantity} {t('piecesLeft')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('recentOrders')}</CardTitle></CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noRecentOrders')}</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">{order.product_name}</p>
                      <p className="text-muted-foreground text-xs">{order.supplier_name}</p>
                    </div>
                    <div className="text-right">
                      <p>{order.quantity} {t('pieces')}</p>
                      <Badge variant={order.status === 'received' ? 'default' : order.status === 'pending' ? 'destructive' : 'secondary'}>
                        {statusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: number | string; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
