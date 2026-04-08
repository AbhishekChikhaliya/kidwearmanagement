import {
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp,
  FileText, Settings, Tags, Warehouse, Receipt, UserCircle, Wallet, RotateCcw,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { t } = useLanguage();

  const items = [
    { title: t('dashboard'), url: '/', icon: LayoutDashboard },
    { title: t('products'), url: '/products', icon: Package },
    { title: t('categories'), url: '/categories', icon: Tags },
    { title: t('orders'), url: '/orders', icon: ShoppingCart },
    { title: t('suppliers'), url: '/suppliers', icon: Users },
    { title: t('customers'), url: '/customers', icon: UserCircle },
    { title: t('sales'), url: '/sales', icon: TrendingUp },
    { title: t('inventory'), url: '/inventory', icon: Warehouse },
    { title: t('expenses'), url: '/expenses', icon: Wallet },
    { title: t('returnsRefunds'), url: '/returns', icon: RotateCcw },
    { title: t('billUpload'), url: '/bill-upload', icon: Receipt },
    { title: t('reports'), url: '/reports', icon: FileText },
    { title: t('settings'), url: '/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">KidWear</span>
            )}
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed ? 'Menu' : ''}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
