
# KidWear Retail Manager — Phase 1: Foundation

## Overview
A retail inventory management system for a small children's clothing shop. Built with React + Supabase, supporting English and Gujarati languages. Single-tenant (one shop owner).

## 1. Database Schema (Supabase/PostgreSQL)

### Tables:
- **categories** — id, name, name_gu (Gujarati), icon, created_at
- **suppliers** — id, name, phone, address, gst_number, created_at
- **products** — id, name, category_id (FK), size, color, brand, barcode, wholesale_price, retail_price, supplier_id (FK), image_url, stock_quantity, min_stock_level, created_at
- **inventory_logs** — id, product_id (FK), type (added/sold/adjusted), quantity, notes, created_at
- **purchase_orders** — id, supplier_id (FK), product_id (FK), quantity, order_date, expected_delivery, status (ordered/received/pending), created_at
- **sales** — id, product_id (FK), quantity, sale_date, created_at

### Seed Data:
- Pre-populate categories: Boys, Girls, Jiyanu, Nightwear, Underwear, Accessories (with Gujarati translations)

## 2. Authentication
- Email/password login using Supabase Auth
- Protected routes — redirect to login if unauthenticated
- Simple login page with KidWear branding

## 3. Dashboard Page
- **Summary cards**: Total Products, Total Categories, Low Stock Items, Today's Sales
- **Low Stock Alerts panel**: Shows products below minimum stock with warning badges
- **Stock Distribution chart** (by category) — pie/donut chart using Recharts
- **Sales Trend chart** (last 7 days) — bar chart
- **Recent Purchase Orders** list

## 4. Layout & Navigation
- **Sidebar navigation** with icons: Dashboard, Products, Orders, Suppliers, Sales, Reports, Settings
- **Top bar** with language toggle (EN/ગુજરાતી) and dark mode switch
- Mobile-responsive with collapsible sidebar
- Clean admin UI inspired by Shopify/Stripe dashboards

## 5. Language Support
- i18n context with English and Gujarati translations
- Language toggle in the header
- All labels, buttons, alerts translated

## 6. Dark Mode
- Dark/light theme toggle using Tailwind dark mode classes

## 7. Design
- Professional color scheme: indigo/blue primary, clean whites, subtle grays
- Card-based dashboard layout
- Consistent spacing and typography
- Mobile-first responsive design

---

**Phase 2 (next iteration):** Product CRUD, Category Management, Supplier Management
**Phase 3:** Sales Entry, Purchase Orders, Inventory Tracking
**Phase 4:** Reports with Excel export, Smart reorder suggestions, Barcode support
