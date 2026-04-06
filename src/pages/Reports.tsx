import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Download, TrendingUp, Package, AlertTriangle, ShoppingCart } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(330, 81%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)'];

export default function Reports() {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [categorySales, setCategorySales] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<any[]>([]);
  const [supplierSummary, setSupplierSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, totalSold: 0 });

  const fetchReports = async () => {
    setLoading(true);

    const [salesRes, productsRes, ordersRes, suppliersRes, categoriesRes] = await Promise.all([
      supabase.from('sales').select('*, products(name, retail_price, wholesale_price, category_id, supplier_id)').gte('sale_date', dateRange.from).lte('sale_date', dateRange.to).order('sale_date'),
      supabase.from('products').select('*, categories(name, name_gu), suppliers(name)'),
      supabase.from('purchase_orders').select('*, products(name), suppliers(name)').gte('order_date', dateRange.from).lte('order_date', dateRange.to),
      supabase.from('suppliers').select('*'),
      supabase.from('categories').select('*'),
    ]);

    const sales = salesRes.data || [];
    const products = productsRes.data || [];

    // Daily sales trend
    const dailyMap: Record<string, { date: string; revenue: number; quantity: number }> = {};
    sales.forEach((s: any) => {
      if (!dailyMap[s.sale_date]) dailyMap[s.sale_date] = { date: s.sale_date, revenue: 0, quantity: 0 };
      dailyMap[s.sale_date].revenue += (s.products?.retail_price || 0) * s.quantity;
      dailyMap[s.sale_date].quantity += s.quantity;
    });
    setSalesData(Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)));

    // Product-wise sales
    const prodMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    sales.forEach((s: any) => {
      const name = s.products?.name || 'Unknown';
      if (!prodMap[name]) prodMap[name] = { name, quantity: 0, revenue: 0 };
      prodMap[name].quantity += s.quantity;
      prodMap[name].revenue += (s.products?.retail_price || 0) * s.quantity;
    });
    setProductSales(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue));

    // Category-wise sales
    const catMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const catNames: Record<string, string> = {};
    (categoriesRes.data || []).forEach((c: any) => {
      catNames[c.id] = language === 'gu' ? (c.name_gu || c.name) : c.name;
    });
    sales.forEach((s: any) => {
      const catId = s.products?.category_id;
      const catName = catId ? (catNames[catId] || 'Other') : 'Other';
      if (!catMap[catName]) catMap[catName] = { name: catName, quantity: 0, revenue: 0 };
      catMap[catName].quantity += s.quantity;
      catMap[catName].revenue += (s.products?.retail_price || 0) * s.quantity;
    });
    setCategorySales(Object.values(catMap));

    // Profit calculation
    let totalRevenue = 0, totalCost = 0, totalSold = 0;
    sales.forEach((s: any) => {
      totalRevenue += (s.products?.retail_price || 0) * s.quantity;
      totalCost += (s.products?.wholesale_price || 0) * s.quantity;
      totalSold += s.quantity;
    });
    setProfitData({ totalRevenue, totalCost, totalProfit: totalRevenue - totalCost, totalSold });

    // Low stock
    const lowStock = products.filter((p: any) => p.stock_quantity <= p.min_stock_level);
    setLowStockProducts(lowStock);

    // Smart reorder suggestions based on sales velocity
    const productSalesMap: Record<string, number> = {};
    sales.forEach((s: any) => { productSalesMap[s.product_id] = (productSalesMap[s.product_id] || 0) + s.quantity; });
    const daysDiff = Math.max(1, (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / 86400000);
    
    const suggestions = products
      .map((p: any) => {
        const soldInPeriod = productSalesMap[p.id] || 0;
        const dailyRate = soldInPeriod / daysDiff;
        const daysOfStock = dailyRate > 0 ? Math.floor(p.stock_quantity / dailyRate) : 999;
        const suggestedOrder = dailyRate > 0 ? Math.ceil(dailyRate * 30) - p.stock_quantity : 0;
        return {
          ...p,
          categoryName: language === 'gu' ? (p.categories?.name_gu || p.categories?.name) : p.categories?.name,
          supplierName: p.suppliers?.name,
          soldInPeriod,
          dailyRate: Math.round(dailyRate * 100) / 100,
          daysOfStock,
          suggestedOrder: Math.max(0, suggestedOrder),
        };
      })
      .filter((p: any) => p.suggestedOrder > 0 || p.stock_quantity <= p.min_stock_level)
      .sort((a: any, b: any) => a.daysOfStock - b.daysOfStock);
    setReorderSuggestions(suggestions);

    // Supplier summary
    const suppMap: Record<string, { name: string; totalOrders: number; totalReceived: number; totalPending: number }> = {};
    (suppliersRes.data || []).forEach((s: any) => {
      suppMap[s.id] = { name: s.name, totalOrders: 0, totalReceived: 0, totalPending: 0 };
    });
    (ordersRes.data || []).forEach((o: any) => {
      if (o.supplier_id && suppMap[o.supplier_id]) {
        suppMap[o.supplier_id].totalOrders += o.quantity;
        if (o.status === 'received') suppMap[o.supplier_id].totalReceived += o.quantity;
        else suppMap[o.supplier_id].totalPending += o.quantity;
      }
    });
    setSupplierSummary(Object.values(suppMap).filter(s => s.totalOrders > 0));

    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [dateRange, language]);

  const exportToExcel = (sheetName: string) => {
    const wb = XLSX.utils.book_new();

    if (sheetName === 'all' || sheetName === 'sales') {
      const ws1 = XLSX.utils.json_to_sheet(salesData.map(d => ({
        [t('date')]: d.date,
        [t('quantity')]: d.quantity,
        [t('revenue')]: `₹${d.revenue.toLocaleString()}`,
      })));
      XLSX.utils.book_append_sheet(wb, ws1, t('salesReport'));
    }

    if (sheetName === 'all' || sheetName === 'products') {
      const ws2 = XLSX.utils.json_to_sheet(productSales.map(d => ({
        [t('product')]: d.name,
        [t('quantity')]: d.quantity,
        [t('revenue')]: `₹${d.revenue.toLocaleString()}`,
      })));
      XLSX.utils.book_append_sheet(wb, ws2, t('productReport'));
    }

    if (sheetName === 'all' || sheetName === 'reorder') {
      const ws3 = XLSX.utils.json_to_sheet(reorderSuggestions.map(d => ({
        [t('product')]: d.name,
        [t('currentStock')]: d.stock_quantity,
        [t('dailySalesRate')]: d.dailyRate,
        [t('daysOfStock')]: d.daysOfStock,
        [t('suggestedOrder')]: d.suggestedOrder,
        [t('supplier')]: d.supplierName || '-',
      })));
      XLSX.utils.book_append_sheet(wb, ws3, t('reorderSuggestions'));
    }

    if (sheetName === 'all' || sheetName === 'inventory') {
      const ws4 = XLSX.utils.json_to_sheet(lowStockProducts.map((d: any) => ({
        [t('product')]: d.name,
        [t('currentStock')]: d.stock_quantity,
        [t('minStockLevel')]: d.min_stock_level,
        [t('category')]: language === 'gu' ? (d.categories?.name_gu || d.categories?.name) : d.categories?.name || '-',
      })));
      XLSX.utils.book_append_sheet(wb, ws4, t('lowStockReport'));
    }

    XLSX.writeFile(wb, `KidWear_Report_${dateRange.from}_${dateRange.to}.xlsx`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('reports')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('from')}:</Label>
            <Input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('to')}:</Label>
            <Input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="w-auto" />
          </div>
          <Button onClick={() => exportToExcel('all')} variant="outline">
            <Download className="h-4 w-4 mr-1" />{t('exportAll')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('totalRevenue')}</p>
                <p className="text-xl font-bold text-foreground">₹{profitData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><ShoppingCart className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('totalSold')}</p>
                <p className="text-xl font-bold text-foreground">{profitData.totalSold} {t('pieces')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('totalProfit')}</p>
                <p className="text-xl font-bold text-foreground">₹{profitData.totalProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockProducts.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lowStockProducts.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('lowStockItems')}</p>
                <p className="text-xl font-bold text-foreground">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">{t('salesReport')}</TabsTrigger>
          <TabsTrigger value="products">{t('productReport')}</TabsTrigger>
          <TabsTrigger value="reorder">{t('reorderSuggestions')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('lowStockReport')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('supplierReport')}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dailySalesTrend')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportToExcel('sales')}>
                <Download className="h-3 w-3 mr-1" />{t('export')}
              </Button>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(v) => new Date(v).toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-IN', { day: 'numeric', month: 'short' })} />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, t('revenue')]} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('categorySalesBreakdown')}</CardTitle></CardHeader>
            <CardContent className="h-64">
              {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorySales} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {categorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-muted-foreground">{t('noSales')}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('productWiseSales')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportToExcel('products')}>
                <Download className="h-3 w-3 mr-1" />{t('export')}
              </Button>
            </CardHeader>
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
                  {productSales.map((p, i) => (
                    <TableRow key={p.name}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.quantity} {t('pieces')}</Badge></TableCell>
                      <TableCell>₹{p.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {productSales.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('noSales')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('smartReorderSuggestions')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportToExcel('reorder')}>
                <Download className="h-3 w-3 mr-1" />{t('export')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('currentStock')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('dailySalesRate')}</TableHead>
                    <TableHead>{t('daysOfStock')}</TableHead>
                    <TableHead>{t('suggestedOrder')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('supplier')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorderSuggestions.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant={p.stock_quantity <= p.min_stock_level ? 'destructive' : 'secondary'}>{p.stock_quantity}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.dailyRate} / {t('day')}</TableCell>
                      <TableCell>
                        <Badge variant={p.daysOfStock <= 7 ? 'destructive' : p.daysOfStock <= 14 ? 'secondary' : 'default'}>
                          {p.daysOfStock === 999 ? '∞' : `${p.daysOfStock} ${t('days')}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-primary">{p.suggestedOrder} {t('pieces')}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.supplierName || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {reorderSuggestions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('noReorderNeeded')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('lowStockReport')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportToExcel('inventory')}>
                <Download className="h-3 w-3 mr-1" />{t('export')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('currentStock')}</TableHead>
                    <TableHead>{t('minStockLevel')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="destructive">{p.stock_quantity}</Badge></TableCell>
                      <TableCell>{p.min_stock_level}</TableCell>
                      <TableCell className="hidden md:table-cell">{language === 'gu' ? (p.categories?.name_gu || p.categories?.name) : p.categories?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('noLowStock')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('supplierOrderSummary')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('supplier')}</TableHead>
                    <TableHead>{t('totalOrdered')}</TableHead>
                    <TableHead>{t('totalReceived')}</TableHead>
                    <TableHead>{t('totalPending')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierSummary.map((s: any) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.totalOrders} {t('pieces')}</TableCell>
                      <TableCell><Badge variant="default">{s.totalReceived}</Badge></TableCell>
                      <TableCell>{s.totalPending > 0 ? <Badge variant="destructive">{s.totalPending}</Badge> : <Badge variant="secondary">0</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {supplierSummary.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('noOrders')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
