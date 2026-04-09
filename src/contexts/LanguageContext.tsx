import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'gu';

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard', products: 'Products', orders: 'Orders', suppliers: 'Suppliers',
    sales: 'Sales', reports: 'Reports', settings: 'Settings', categories: 'Categories',
    inventory: 'Inventory',
    // Dashboard
    totalProducts: 'Total Products', totalCategories: 'Total Categories',
    lowStockItems: 'Low Stock Items', todaysSales: 'Today\'s Sales',
    lowStockAlerts: 'Low Stock Alerts', stockDistribution: 'Stock Distribution',
    salesTrend: 'Sales Trend (Last 7 Days)', recentOrders: 'Recent Purchase Orders',
    piecesLeft: 'pieces left', noLowStock: 'All stock levels are healthy!',
    noRecentOrders: 'No recent orders',
    // Auth
    login: 'Login', logout: 'Logout', email: 'Email', password: 'Password',
    signIn: 'Sign In', signingIn: 'Signing in...', signUp: 'Sign Up',
    signingUp: 'Signing up...', noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?', appName: 'KidWear Retail Manager',
    appTagline: 'Smart inventory management for children\'s clothing shops',
    // Status
    ordered: 'Ordered', received: 'Received', pending: 'Pending',
    // General
    pieces: 'pcs', quantity: 'Quantity', product: 'Product', supplier: 'Supplier',
    status: 'Status', date: 'Date', darkMode: 'Dark Mode', language: 'Language',
    name: 'Name', actions: 'Actions', add: 'Add', update: 'Update', cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this?', nameRequired: 'Name is required',
    type: 'Type', notes: 'Notes', amount: 'Amount',
    // Products
    addProduct: 'Add Product', editProduct: 'Edit Product', searchProducts: 'Search products...',
    noProducts: 'No products found', productAdded: 'Product added successfully',
    productUpdated: 'Product updated successfully', productDeleted: 'Product deleted successfully',
    category: 'Category', brand: 'Brand', stock: 'Stock',
    retailPrice: 'Retail Price', wholesalePrice: 'Wholesale Price',
    size: 'Size', color: 'Color', barcode: 'Barcode',
    stockQuantity: 'Stock Quantity', minStockLevel: 'Min Stock Level',
    // Categories
    addCategory: 'Add Category', editCategory: 'Edit Category',
    noCategories: 'No categories found', categoryAdded: 'Category added successfully',
    categoryUpdated: 'Category updated successfully', categoryDeleted: 'Category deleted successfully',
    nameEn: 'Name (English)', nameGu: 'Name (Gujarati)', icon: 'Icon',
    // Suppliers
    addSupplier: 'Add Supplier', editSupplier: 'Edit Supplier',
    searchSuppliers: 'Search suppliers...', noSuppliers: 'No suppliers found',
    supplierAdded: 'Supplier added successfully', supplierUpdated: 'Supplier updated successfully',
    supplierDeleted: 'Supplier deleted successfully',
    phone: 'Phone', gstNumber: 'GST Number', address: 'Address',
    // Sales
    recordSale: 'Record Sale', selectProduct: 'Select a product',
    invalidQuantity: 'Invalid quantity', insufficientStock: 'Insufficient stock',
    saleRecorded: 'Sale recorded successfully', saleDeleted: 'Sale deleted',
    noSales: 'No sales recorded yet',
    // Orders
    createOrder: 'Create Order', selectProductSupplier: 'Please select product and supplier',
    orderCreated: 'Order created successfully', orderReceived: 'Order marked as received',
    orderDeleted: 'Order deleted', noOrders: 'No orders found',
    expectedDelivery: 'Expected Delivery', orderDate: 'Order Date',
    markReceived: 'Mark as Received',
    // Inventory
    inventoryTracking: 'Inventory Tracking', adjustStock: 'Adjust Stock',
    activityLog: 'Activity Log', currentStock: 'Current Stock',
    added: 'Added', sold: 'Sold', adjusted: 'Adjusted',
    stockAdjusted: 'Stock adjusted successfully', noLogs: 'No inventory logs yet',
    newStockValue: 'New Stock Value', optionalNotes: 'Optional notes...',
    // Reports
    from: 'From', to: 'To', exportAll: 'Export All', export: 'Export',
    totalRevenue: 'Total Revenue', totalSold: 'Total Sold', totalProfit: 'Total Profit',
    salesReport: 'Sales Report', productReport: 'Product Report',
    reorderSuggestions: 'Reorder Suggestions', lowStockReport: 'Low Stock Report',
    supplierReport: 'Supplier Report', dailySalesTrend: 'Daily Sales Trend',
    categorySalesBreakdown: 'Category Sales Breakdown', productWiseSales: 'Product-wise Sales',
    smartReorderSuggestions: 'Smart Reorder Suggestions', noReorderNeeded: 'All products are well stocked!',
    supplierOrderSummary: 'Supplier Order Summary', totalOrdered: 'Total Ordered',
    totalReceived: 'Total Received', totalPending: 'Total Pending',
    revenue: 'Revenue', quantitySold: 'Qty Sold', dailySalesRate: 'Daily Rate',
    daysOfStock: 'Days of Stock', suggestedOrder: 'Suggested Order', day: 'day', days: 'days',
    // Settings
    shopInfo: 'Shop Information', shopName: 'Shop Name', appearance: 'Appearance',
    darkModeDesc: 'Switch between light and dark themes', languageDesc: 'Choose your preferred language',
    security: 'Security', newPassword: 'New Password', confirmPassword: 'Confirm Password',
    changePassword: 'Change Password', saving: 'Saving...', passwordChanged: 'Password changed successfully',
    passwordsDoNotMatch: 'Passwords do not match', passwordTooShort: 'Password must be at least 6 characters',
    dangerZone: 'Danger Zone', logoutDesc: 'Sign out of your account on this device.',
    // Barcode
    generateBarcode: 'Generate Barcode', barcodeGenerated: 'Barcode generated',
    // Bill Upload
    billUpload: 'Bill Upload', uploadBillImage: 'Please upload a bill image',
    uploadingBill: 'Uploading bill...', extractingDetails: 'AI is extracting details...',
    dropOrClickBill: 'Click or drop supplier bill image here',
    supportedFormats: 'Supports JPG, PNG images',
    billExtracted: 'Bill details extracted successfully',
    extractionFailed: 'Failed to extract bill details',
    billPreview: 'Bill Preview', extractedDetails: 'Extracted Details',
    billNo: 'Bill No', existingSupplier: 'Existing Supplier', newSupplier: 'New Supplier',
    items: 'Items', confirmAndAddStock: 'Confirm & Add to Stock',
    billSaved: 'Bill processed — products & stock updated!', saveFailed: 'Failed to save',
    // Invoice
    invoice: 'Invoice', printInvoice: 'Print Invoice', thankYou: 'Thank you for your purchase!',
    customerName: 'Customer Name', customerPhone: 'Customer Phone',
    // Forgot/Reset Password
    forgotPassword: 'Forgot Password?', forgotPasswordDesc: 'Enter your email to receive a password reset link.',
    sendResetLink: 'Send Reset Link', sendingResetLink: 'Sending...',
    resetEmailSent: 'Password reset link sent! Check your email.',
    checkEmailConfirm: 'Check your email to confirm your account.',
    resetPassword: 'Reset Password', enterNewPassword: 'Enter your new password below.',
    backToLogin: 'Back to Login', invalidResetLink: 'This reset link is invalid or has expired.',
    // Customers
    customers: 'Customers', addCustomer: 'Add Customer', editCustomer: 'Edit Customer',
    searchCustomers: 'Search customers...', noCustomers: 'No customers found',
    customerAdded: 'Customer added successfully', customerUpdated: 'Customer updated successfully',
    customerDeleted: 'Customer deleted successfully',
    // Expenses
    expenses: 'Expenses', addExpense: 'Add Expense', totalExpenses: 'Total Expenses',
    expenseAdded: 'Expense added', expenseDeleted: 'Expense deleted',
    noExpenses: 'No expenses found', invalidAmount: 'Please enter a valid amount',
    description: 'Description',
    // Expense categories
    rent: 'Rent', salary: 'Salary', utilities: 'Utilities', transport: 'Transport',
    packaging: 'Packaging', marketing: 'Marketing', maintenance: 'Maintenance', other: 'Other',
    // Enhanced Sales
    discount: 'Discount', paymentMode: 'Payment Mode', cash: 'Cash', upi: 'UPI', card: 'Card',
    customer: 'Customer', selectCustomer: 'Select Customer (Optional)',
    subtotal: 'Subtotal', total: 'Total',
    // Dashboard
    totalStockValue: 'Stock Value', monthlyRevenue: 'Monthly Revenue',
    monthlyExpenses: 'Monthly Expenses', netProfit: 'Net Profit',
    topSellingProducts: 'Top Selling Products', profitLoss: 'Profit & Loss',
    // Returns/Refunds
    returnsRefunds: 'Returns & Refunds', processReturn: 'Process Return',
    returnProcessed: 'Return processed successfully', returnDeleted: 'Return deleted',
    totalRefunds: 'Total Refunds', refundAmount: 'Refund Amount',
    reason: 'Reason', noReturns: 'No returns recorded yet',
    refundPerPiece: 'Refund per Piece', returnReasonPlaceholder: 'e.g. Damaged, wrong size, defective...',
    totalRefund: 'Total Refund',
    // Notifications
    notifications: 'Notifications', markAllRead: 'Mark all read',
    noNotifications: 'No notifications', lowStockAlert: 'Low Stock Alert',
    more: 'more',
    // Product Images
    uploadImage: 'Upload Image', invalidImage: 'Please select an image file',
    imageTooLarge: 'Image must be under 5MB', imageUploaded: 'Image uploaded',
    uploadFailed: 'Upload failed', productImage: 'Product Image',
    // Sales Dashboard
    salesDashboard: 'Sales Dashboard', totalOrders: 'Total Orders',
    avgOrderValue: 'Avg Order Value', uniqueCustomers: 'Unique Customers',
    revenueTrend: 'Revenue Trend', paymentBreakdown: 'Payment Breakdown',
    weekdayPattern: 'Weekday Pattern', topCustomers: 'Top Customers',
    ordersLabel: 'orders', walkInCustomer: 'Walk-in',
    // Financial Dashboard
    financialDashboard: 'Financial Dashboard', grossProfit: 'Gross Profit',
    profitMargin: 'Profit Margin', plStatement: 'Profit & Loss Statement',
    costOfGoods: 'Cost of Goods Sold', operatingExpenses: 'Operating Expenses',
    monthlyPLTrend: 'Monthly P&L Trend', expenseBreakdown: 'Expense Breakdown',
    marginTrend: 'Margin Trend',
  },
  gu: {
    dashboard: 'ડેશબોર્ડ', products: 'પ્રોડક્ટ્સ', orders: 'ઓર્ડર્સ', suppliers: 'સપ્લાયર્સ',
    sales: 'વેચાણ', reports: 'રિપોર્ટ્સ', settings: 'સેટિંગ્સ', categories: 'કેટેગરી',
    inventory: 'ઇન્વેન્ટરી',
    totalProducts: 'કુલ પ્રોડક્ટ્સ', totalCategories: 'કુલ કેટેગરી',
    lowStockItems: 'ઓછો સ્ટોક', todaysSales: 'આજનું વેચાણ',
    lowStockAlerts: 'ઓછા સ્ટોકની ચેતવણી', stockDistribution: 'સ્ટોક વિતરણ',
    salesTrend: 'વેચાણ ટ્રેન્ડ (છેલ્લા ૭ દિવસ)', recentOrders: 'તાજેતરના ઓર્ડર્સ',
    piecesLeft: 'પીસ બાકી', noLowStock: 'બધા સ્ટોક લેવલ સારા છે!',
    noRecentOrders: 'કોઈ તાજેતરના ઓર્ડર નથી',
    login: 'લોગિન', logout: 'લોગઆઉટ', email: 'ઇમેઇલ', password: 'પાસવર્ડ',
    signIn: 'સાઇન ઇન', signingIn: 'સાઇન ઇન થઈ રહ્યું છે...',
    signUp: 'સાઇન અપ', signingUp: 'સાઇન અપ થઈ રહ્યું છે...',
    noAccount: 'એકાઉન્ટ નથી?', haveAccount: 'પહેલેથી એકાઉન્ટ છે?',
    appName: 'KidWear રિટેલ મેનેજર',
    appTagline: 'બાળકોના કપડાંની દુકાન માટે સ્માર્ટ ઇન્વેન્ટરી મેનેજમેન્ટ',
    ordered: 'ઓર્ડર કરેલ', received: 'મળેલ', pending: 'બાકી',
    pieces: 'પીસ', quantity: 'જથ્થો', product: 'પ્રોડક્ટ', supplier: 'સપ્લાયર',
    status: 'સ્ટેટસ', date: 'તારીખ', darkMode: 'ડાર્ક મોડ', language: 'ભાષા',
    name: 'નામ', actions: 'ક્રિયાઓ', add: 'ઉમેરો', update: 'અપડેટ', cancel: 'રદ કરો',
    confirmDelete: 'શું તમે ખરેખર ડિલીટ કરવા માંગો છો?', nameRequired: 'નામ જરૂરી છે',
    type: 'પ્રકાર', notes: 'નોંધ', amount: 'રકમ',
    addProduct: 'પ્રોડક્ટ ઉમેરો', editProduct: 'પ્રોડક્ટ સંપાદિત કરો',
    searchProducts: 'પ્રોડક્ટ્સ શોધો...', noProducts: 'કોઈ પ્રોડક્ટ મળી નથી',
    productAdded: 'પ્રોડક્ટ સફળતાપૂર્વક ઉમેરાઈ', productUpdated: 'પ્રોડક્ટ સફળતાપૂર્વક અપડેટ થઈ',
    productDeleted: 'પ્રોડક્ટ સફળતાપૂર્વક ડિલીટ થઈ',
    category: 'કેટેગરી', brand: 'બ્રાન્ડ', stock: 'સ્ટોક',
    retailPrice: 'છૂટક કિંમત', wholesalePrice: 'જથ્થાબંધ કિંમત',
    size: 'સાઇઝ', color: 'રંગ', barcode: 'બારકોડ',
    stockQuantity: 'સ્ટોક જથ્થો', minStockLevel: 'ન્યૂનતમ સ્ટોક',
    addCategory: 'કેટેગરી ઉમેરો', editCategory: 'કેટેગરી સંપાદિત કરો',
    noCategories: 'કોઈ કેટેગરી મળી નથી', categoryAdded: 'કેટેગરી સફળતાપૂર્વક ઉમેરાઈ',
    categoryUpdated: 'કેટેગરી સફળતાપૂર્વક અપડેટ થઈ', categoryDeleted: 'કેટેગરી સફળતાપૂર્વક ડિલીટ થઈ',
    nameEn: 'નામ (અંગ્રેજી)', nameGu: 'નામ (ગુજરાતી)', icon: 'આઇકોન',
    addSupplier: 'સપ્લાયર ઉમેરો', editSupplier: 'સપ્લાયર સંપાદિત કરો',
    searchSuppliers: 'સપ્લાયર્સ શોધો...', noSuppliers: 'કોઈ સપ્લાયર મળ્યા નથી',
    supplierAdded: 'સપ્લાયર સફળતાપૂર્વક ઉમેરાયા', supplierUpdated: 'સપ્લાયર સફળતાપૂર્વક અપડેટ થયા',
    supplierDeleted: 'સપ્લાયર સફળતાપૂર્વક ડિલીટ થયા',
    phone: 'ફોન', gstNumber: 'GST નંબર', address: 'સરનામું',
    recordSale: 'વેચાણ નોંધો', selectProduct: 'પ્રોડક્ટ પસંદ કરો',
    invalidQuantity: 'અમાન્ય જથ્થો', insufficientStock: 'અપૂરતો સ્ટોક',
    saleRecorded: 'વેચાણ સફળતાપૂર્વક નોંધાયું', saleDeleted: 'વેચાણ ડિલીટ થયું',
    noSales: 'હજી કોઈ વેચાણ નોંધાયું નથી',
    createOrder: 'ઓર્ડર બનાવો', selectProductSupplier: 'કૃપા કરી પ્રોડક્ટ અને સપ્લાયર પસંદ કરો',
    orderCreated: 'ઓર્ડર સફળતાપૂર્વક બનાવ્યો', orderReceived: 'ઓર્ડર મળેલ તરીકે ચિહ્નિત',
    orderDeleted: 'ઓર્ડર ડિલીટ થયો', noOrders: 'કોઈ ઓર્ડર મળ્યા નથી',
    expectedDelivery: 'અપેક્ષિત ડિલિવરી', orderDate: 'ઓર્ડર તારીખ',
    markReceived: 'મળેલ તરીકે ચિહ્નિત કરો',
    inventoryTracking: 'ઇન્વેન્ટરી ટ્રેકિંગ', adjustStock: 'સ્ટોક એડજસ્ટ કરો',
    activityLog: 'પ્રવૃત્તિ લૉગ', currentStock: 'વર્તમાન સ્ટોક',
    added: 'ઉમેર્યું', sold: 'વેચ્યું', adjusted: 'એડજસ્ટ',
    stockAdjusted: 'સ્ટોક સફળતાપૂર્વક એડજસ્ટ થયો', noLogs: 'હજી કોઈ ઇન્વેન્ટરી લૉગ નથી',
    newStockValue: 'નવી સ્ટોક વેલ્યુ', optionalNotes: 'વૈકલ્પિક નોંધ...',
    from: 'થી', to: 'સુધી', exportAll: 'બધું નિકાસ કરો', export: 'નિકાસ',
    totalRevenue: 'કુલ આવક', totalSold: 'કુલ વેચાણ', totalProfit: 'કુલ નફો',
    salesReport: 'વેચાણ રિપોર્ટ', productReport: 'પ્રોડક્ટ રિપોર્ટ',
    reorderSuggestions: 'રીઓર્ડર સૂચનો', lowStockReport: 'ઓછા સ્ટોક રિપોર્ટ',
    supplierReport: 'સપ્લાયર રિપોર્ટ', dailySalesTrend: 'દૈનિક વેચાણ ટ્રેન્ડ',
    categorySalesBreakdown: 'કેટેગરી વેચાણ વિશ્લેષણ', productWiseSales: 'પ્રોડક્ટ પ્રમાણે વેચાણ',
    smartReorderSuggestions: 'સ્માર્ટ રીઓર્ડર સૂચનો', noReorderNeeded: 'બધા પ્રોડક્ટ્સમાં પૂરતો સ્ટોક છે!',
    supplierOrderSummary: 'સપ્લાયર ઓર્ડર સારાંશ', totalOrdered: 'કુલ ઓર્ડર',
    totalReceived: 'કુલ મળેલ', totalPending: 'કુલ બાકી',
    revenue: 'આવક', quantitySold: 'વેચાયેલ જથ્થો', dailySalesRate: 'દૈનિક દર',
    daysOfStock: 'સ્ટોકના દિવસો', suggestedOrder: 'સૂચિત ઓર્ડર', day: 'દિવસ', days: 'દિવસો',
    shopInfo: 'દુકાનની માહિતી', shopName: 'દુકાનનું નામ', appearance: 'દેખાવ',
    darkModeDesc: 'લાઇટ અને ડાર્ક થીમ વચ્ચે સ્વિચ કરો', languageDesc: 'તમારી પસંદીદા ભાષા પસંદ કરો',
    security: 'સુરક્ષા', newPassword: 'નવો પાસવર્ડ', confirmPassword: 'પાસવર્ડ ખાતરી કરો',
    changePassword: 'પાસવર્ડ બદલો', saving: 'સેવ થઈ રહ્યું છે...', passwordChanged: 'પાસવર્ડ સફળતાપૂર્વક બદલાયો',
    passwordsDoNotMatch: 'પાસવર્ડ મેળ ખાતા નથી', passwordTooShort: 'પાસવર્ડ ઓછામાં ઓછા ૬ અક્ષરનો હોવો જોઈએ',
    dangerZone: 'ડેન્જર ઝોન', logoutDesc: 'આ ઉપકરણ પરથી તમારા એકાઉન્ટમાંથી સાઇન આઉટ કરો.',
    generateBarcode: 'બારકોડ જનરેટ કરો', barcodeGenerated: 'બારકોડ જનરેટ થયો',
    billUpload: 'બિલ અપલોડ', uploadBillImage: 'કૃપા કરી બિલની છબી અપલોડ કરો',
    uploadingBill: 'બિલ અપલોડ થઈ રહ્યું છે...', extractingDetails: 'AI વિગતો કાઢી રહ્યું છે...',
    dropOrClickBill: 'સપ્લાયર બિલની છબી અહીં ક્લિક કરો અથવા મૂકો',
    supportedFormats: 'JPG, PNG ફોર્મેટ સપોર્ટેડ છે',
    billExtracted: 'બિલની વિગતો સફળતાપૂર્વક કાઢવામાં આવી',
    extractionFailed: 'બિલની વિગતો કાઢવામાં નિષ્ફળ',
    billPreview: 'બિલ પ્રીવ્યૂ', extractedDetails: 'કાઢવામાં આવેલી વિગતો',
    billNo: 'બિલ નંબર', existingSupplier: 'હાલનો સપ્લાયર', newSupplier: 'નવો સપ્લાયર',
    items: 'આઇટમ્સ', confirmAndAddStock: 'પુષ્ટિ કરો અને સ્ટોકમાં ઉમેરો',
    billSaved: 'બિલ પ્રોસેસ થયું — પ્રોડક્ટ્સ અને સ્ટોક અપડેટ થયા!', saveFailed: 'સેવ નિષ્ફળ',
    invoice: 'ઇન્વોઇસ', printInvoice: 'ઇન્વોઇસ પ્રિન્ટ કરો', thankYou: 'તમારી ખરીદી માટે આભાર!',
    customerName: 'ગ્રાહકનું નામ', customerPhone: 'ગ્રાહકનો ફોન',
    forgotPassword: 'પાસવર્ડ ભૂલી ગયા?', forgotPasswordDesc: 'પાસવર્ડ રીસેટ લિંક મેળવવા માટે તમારો ઇમેઇલ દાખલ કરો.',
    sendResetLink: 'રીસેટ લિંક મોકલો', sendingResetLink: 'મોકલી રહ્યા છીએ...',
    resetEmailSent: 'પાસવર્ડ રીસેટ લિંક મોકલવામાં આવી! તમારો ઇમેઇલ ચેક કરો.',
    checkEmailConfirm: 'તમારો એકાઉન્ટ કન્ફર્મ કરવા ઇમેઇલ ચેક કરો.',
    resetPassword: 'પાસવર્ડ રીસેટ કરો', enterNewPassword: 'નીચે તમારો નવો પાસવર્ડ દાખલ કરો.',
    backToLogin: 'લોગિન પર પાછા જાઓ', invalidResetLink: 'આ રીસેટ લિંક અમાન્ય અથવા સમયસીમા વીતી ગઈ છે.',
    customers: 'ગ્રાહકો', addCustomer: 'ગ્રાહક ઉમેરો', editCustomer: 'ગ્રાહક સંપાદિત કરો',
    searchCustomers: 'ગ્રાહકો શોધો...', noCustomers: 'કોઈ ગ્રાહક મળ્યા નથી',
    customerAdded: 'ગ્રાહક સફળતાપૂર્વક ઉમેરાયા', customerUpdated: 'ગ્રાહક સફળતાપૂર્વક અપડેટ થયા',
    customerDeleted: 'ગ્રાહક સફળતાપૂર્વક ડિલીટ થયા',
    expenses: 'ખર્ચ', addExpense: 'ખર્ચ ઉમેરો', totalExpenses: 'કુલ ખર્ચ',
    expenseAdded: 'ખર્ચ ઉમેરાયો', expenseDeleted: 'ખર્ચ ડિલીટ થયો',
    noExpenses: 'કોઈ ખર્ચ મળ્યો નથી', invalidAmount: 'કૃપા કરી માન્ય રકમ દાખલ કરો',
    description: 'વર્ણન',
    rent: 'ભાડું', salary: 'પગાર', utilities: 'ઉપયોગિતાઓ', transport: 'પરિવહન',
    packaging: 'પેકેજિંગ', marketing: 'માર્કેટિંગ', maintenance: 'જાળવણી', other: 'અન્ય',
    discount: 'ડિસ્કાઉન્ટ', paymentMode: 'ચુકવણી પદ્ધતિ', cash: 'રોકડ', upi: 'UPI', card: 'કાર્ડ',
    customer: 'ગ્રાહક', selectCustomer: 'ગ્રાહક પસંદ કરો (વૈકલ્પિક)',
    subtotal: 'પેટા કુલ', total: 'કુલ',
    totalStockValue: 'સ્ટોક મૂલ્ય', monthlyRevenue: 'માસિક આવક',
    monthlyExpenses: 'માસિક ખર્ચ', netProfit: 'ચોખ્ખો નફો',
    topSellingProducts: 'સૌથી વધુ વેચાતા પ્રોડક્ટ્સ', profitLoss: 'નફો અને નુકસાન',
    // Returns/Refunds
    returnsRefunds: 'રિટર્ન અને રિફંડ', processReturn: 'રિટર્ન પ્રોસેસ કરો',
    returnProcessed: 'રિટર્ન સફળતાપૂર્વક પ્રોસેસ થયું', returnDeleted: 'રિટર્ન ડિલીટ થયું',
    totalRefunds: 'કુલ રિફંડ', refundAmount: 'રિફંડ રકમ',
    reason: 'કારણ', noReturns: 'હજી કોઈ રિટર્ન નોંધાયું નથી',
    refundPerPiece: 'પ્રતિ પીસ રિફંડ', returnReasonPlaceholder: 'દા.ત. તૂટેલું, ખોટી સાઇઝ, ખામીયુક્ત...',
    totalRefund: 'કુલ રિફંડ',
    // Notifications
    notifications: 'સૂચનાઓ', markAllRead: 'બધું વાંચ્યું',
    noNotifications: 'કોઈ સૂચના નથી', lowStockAlert: 'ઓછા સ્ટોકની ચેતવણી',
    more: 'વધુ',
    // Product Images
    uploadImage: 'છબી અપલોડ', invalidImage: 'કૃપા કરી છબી ફાઇલ પસંદ કરો',
    imageTooLarge: 'છબી 5MB કરતાં ઓછી હોવી જોઈએ', imageUploaded: 'છબી અપલોડ થઈ',
    uploadFailed: 'અપલોડ નિષ્ફળ', productImage: 'પ્રોડક્ટ છબી',
    // Sales Dashboard
    salesDashboard: 'વેચાણ ડેશબોર્ડ', totalOrders: 'કુલ ઓર્ડર્સ',
    avgOrderValue: 'સરેરાશ ઓર્ડર મૂલ્ય', uniqueCustomers: 'અનન્ય ગ્રાહકો',
    revenueTrend: 'આવક ટ્રેન્ડ', paymentBreakdown: 'ચુકવણી વિશ્લેષણ',
    weekdayPattern: 'અઠવાડિયાનો પેટર્ન', topCustomers: 'ટોચના ગ્રાહકો',
    ordersLabel: 'ઓર્ડર્સ', walkInCustomer: 'વૉક-ઇન',
    // Financial Dashboard
    financialDashboard: 'નાણાકીય ડેશબોર્ડ', grossProfit: 'કુલ નફો',
    profitMargin: 'નફા માર્જિન', plStatement: 'નફો અને નુકસાન સ્ટેટમેન્ટ',
    costOfGoods: 'માલની કિંમત', operatingExpenses: 'સંચાલન ખર્ચ',
    monthlyPLTrend: 'માસિક P&L ટ્રેન્ડ', expenseBreakdown: 'ખર્ચ વિશ્લેષણ',
    marginTrend: 'માર્જિન ટ્રેન્ડ',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('kidwear-lang') as Language) || 'en';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('kidwear-lang', lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
