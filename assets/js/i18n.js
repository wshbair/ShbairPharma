// i18n.js — Arabic / English language support for ShbairPharma POS
'use strict';

var translations = {
  en: {
    // Splash
    please_wait: 'Please wait...',

    // Login
    username: 'Username',
    password: 'Password',
    sign_in: 'Sign In',

    // Navbar
    products: 'Products',
    categories: 'Categories',
    providers: 'Providers',
    hold_orders: 'Hold Orders',
    orders: 'Orders',
    transactions: 'Transactions',
    point_of_sale: 'Point of Sale',
    users: 'Users',
    settings: 'Settings',
    my_profile: 'My Profile',
    sign_out: 'Sign Out',
    walk_in_customer: 'Walk in customer',
    select_category: 'Select',
    // POS – Cart
    new_btn: 'New',
    scan_barcode: 'Scan barcode or enter SKU...',
    search_products: 'Search by name or SKU...',
    items: 'Items',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total_tax_prefix: 'TOTAL (inc ',
    total_tax_suffix: '% Tax)',
    cancel: 'Cancel',
    hold_btn: 'Hold',
    pay_now: 'Pay Now',

    // Cart table headers
    cart_hash: '#',
    cart_item: 'Item',
    cart_qty: 'Qty',
    cart_price: 'Price',

    // Transactions view
    sales: 'SALES',
    total_transactions: 'TRANSACTIONS',
    items_sold: 'ITEMS SOLD',
    total_products: 'PRODUCTS',
    till: 'Till',
    cashier: 'Cashier',
    status: 'Status',
    paid: 'Paid',
    unpaid: 'Unpaid',
    date: 'Date',
    products_title: 'Products',
    name_col: 'Name',
    sold_col: 'Sold',
    available_col: 'Available',
    sales_col: 'Sales',
    trans_details: 'Transaction Details',
    invoice_col: 'Invoice',
    date_col: 'Date',
    total_col: 'Total',
    paid_col: 'Paid',
    change_col: 'Change',
    method_col: 'Method',
    till_col: 'Till',
    cashier_col: 'Cashier',
    view_col: 'View',

    // Hold Order Modal
    hold_order: 'Hold Order',
    enter_reference: 'Enter a reference',
    hold_order_btn: 'Hold Order',

    // Payment Modal
    payment: 'Payment',
    price_label: 'Price',
    payment_label: 'Payment',
    cash: 'Cash',
    card: 'Card',
    card_info: 'Card Info',
    change: 'Change',
    confirm_payment: 'Confirm Payment',

    // New Customer
    new_customer: 'New Customer',
    customer_name_lbl: 'Customer Name*',
    phone_lbl: 'Phone',
    email_lbl: 'Email',
    address_lbl: 'Address',
    enter_name: 'Enter name',
    phone_placeholder: 'Phone number',
    email_placeholder: 'Email address',
    address_placeholder: 'Address',

    // Add / Modify Product
    add_modify_product: 'Add / Modify Product',
    category_lbl: 'Category',
    barcode_lbl: 'Barcode',
    cost_price_lbl: 'Cost Price',
    provider_lbl: 'Provider',
    provider_modal: 'Provider',
    providers_modal: 'Providers',
    provider_name_placeholder: 'Provider name',
    filter_by_provider_lbl: 'Filter by Provider',
    all_providers_opt: 'All Providers',
    total_cost: 'Total Cost',
    total_profit: 'Profit',
    expiry_date_lbl: 'Expiry Date',
    min_stock_lbl: 'Minimum Stock',
    disable_stock_lbl: 'Disable stock check',
    product_name_lbl: 'Product Name',
    profit_margin_lbl: 'Profit Margin',
    sale_price_lbl: 'Sale Price',
    quantity_lbl: 'Quantity',
    invoice_id_lbl: 'Invoice ID',
    entry_date_lbl: 'Entry Date',
    remove_lbl: 'Remove',
    picture_lbl: 'Picture',

    // Category Modal
    category_modal: 'Category',
    name_lbl: 'Name',
    category_name_placeholder: 'Category name',

    // Products List Modal
    products_modal: 'Products',
    barcode_col: 'Barcode',
    price_col: 'Price',
    cost_price_col: 'Cost Price',
    qty_col: 'Qty',
    category_col: 'Category',
    action_col: 'Action',
    STOCK: 'Stock',

    // Users Modal
    users_modal: 'Users',
    username_col: 'Username',
    status_col: 'Status',

    // Categories Modal
    categories_modal: 'Categories',

    // User Account Modal
    account_info: 'Account Information',
    full_name_lbl: 'Name*',
    username_lbl: 'Username*',
    password_lbl: 'Password',
    repeat_password_lbl: 'Repeat Password',
    full_name_placeholder: 'Full name',
    username_placeholder: 'Login username',
    password_placeholder: 'Password',
    repeat_placeholder: 'Repeat',
    permissions: 'Permissions',
    perm_products: 'Manage Products and Stock',
    perm_categories: 'Manage Product Categories',
    perm_transactions: 'View Transactions',
    perm_users: 'Manage Users and Permissions',
    perm_settings: 'Manage Settings',

    // Hold Orders Modal
    open_orders: 'Open Orders',
    search_order: 'Search order by reference',

    // Customer Orders Modal
    customer_orders: 'Customer Orders',
    search_customer: 'Search by customer name',

    // View Order Modal
    print_btn: 'Print',
    reload_tip: 'Right-Click and Reload if you get stuck after cancelling a print.',

    // Settings Modal
    settings_modal: 'Settings',
    app_mode: 'Application Mode',
    standalone_pos: 'Standalone Point of Sale',
    network_terminal: 'Network Point of Sale Terminal',
    network_server: 'Network Point of Sale Server',
    server_ip_lbl: 'Server IP Address*',
    till_number_lbl: 'Till Number*',
    hardware_id_lbl: 'Hardware ID',
    save_settings_val: 'Save Settings',
    store_name_lbl: 'Store Name',
    addr_line_1_lbl: 'Address Line 1',
    contact_lbl: 'Contact Number',
    vat_number_lbl: 'VAT Number',
    footer_lbl: 'Receipt Footer',
    currency_lbl: 'Currency Symbol',
    addr_line_2_lbl: 'Address Line 2',
    vat_pct_lbl: 'VAT Percentage',
    charge_vat_lbl: 'Charge VAT',
    logo_lbl: 'Pharmacy Logo',
    logo_note: 'Max 2MB · jpeg, jpg, png, webp',
    upload_products_h4: 'Upload Products File',
    upload_btn: 'Upload Products',

    //Providers
    provider_info: 'Provider Information',
    provider_name_lbl: 'Name',
    provider_phone_lbl: 'Phone',
    provider_email_lbl: 'Email',
    provider_name_placeholder: 'Provider name',
    provider_balance_lbl: 'Outstanding',
    invoice_list: 'Invoice List',

    // Invoice columns & form
    invoice_issue_date: 'Invoice Date',
    invoice_amount_lbl: 'Amount',
    invoice_number_of_items_lbl: '#Items',
    due_date_lbl: 'Due Date',
    net_amount_lbl: 'Net Amount',
    total_amount_lbl: 'Total Amount',
    tax_amount_lbl: 'Tax Amount',
    discount_amount_lbl: 'Discount',
    payment_status_lbl: 'Status',
    notes_lbl: 'Notes',
    invoice_photo_lbl: 'Invoice Photo / PDF',
    invoice_file_note: 'Max 10MB · pdf, jpg, png',
    invoice_id_auto_hint: 'Auto-generated if empty',

    // Invoice status badges
    status_paid: 'Paid',
    status_pending: 'Pending',
    status_overdue: 'Overdue',

    // Invoice actions / modal
    add_invoice_btn: 'Add Invoice',
    add_invoice_title: 'Add Invoice',
    edit_invoice_title: 'Edit Invoice',
    current_file_lbl: 'Attached File',
    replace_file_lbl: 'Replace with new file (optional)',
    invoices_nav_btn: 'Invoices',
    inv_search_id_placeholder: 'Search by Invoice ID...',
    inv_all_providers: 'All Providers',
    inv_all_statuses: 'All Statuses',
    inv_date_from: 'From',
    inv_date_to: 'To',
    inv_amount_min: 'Min',
    inv_amount_max: 'Max',
    inv_detail_title: 'Invoice Details',
    inv_linked_products: 'Linked Products',
    inv_click_hint: 'Select an invoice to view details and linked products',
    inv_no_results: 'No invoices match your search',
    inv_no_linked_products: 'No linked products for this invoice',
    payment_history_lbl: 'Payment History',
    add_payment_btn: 'Add Payment',
    add_payment_title: 'Add Payment',
    edit_payment_title: 'Edit Payment',
    save_payment_btn: 'Save Payment',
    pay_stat_invoiced: 'Total Invoiced',
    pay_stat_paid: 'Total Payments',
    pay_stat_balance: 'Remaining Balance',
    pay_stat_count: 'Payments Made',
    pay_date_lbl: 'Date',
    pay_amount_lbl: 'Amount',
    pay_method_lbl: 'Method',
    pay_reference_lbl: 'Reference / Check No.',
    pay_running_balance_lbl: 'Running Balance',
    pay_method_cash: 'Cash',
    pay_method_bank: 'Bank Transfer',
    pay_method_check: 'Check',
    pay_method_other: 'Other',
    save_invoice_btn: 'Save Invoice',
    mark_as_paid_btn: 'Mark as Paid',
    view_invoice_lbl: 'Invoice Preview',
    open_externally_btn: 'Open in Viewer',
    close_btn: 'Close',
    pdf_open_hint: 'Click "Open in Viewer" to view this PDF.',

    // Invoice stats cards
    stat_total_invoices: 'Total Invoices',
    stat_total_amount: 'Total Amount',
    stat_paid_amount: 'Paid',
    stat_pending_amount: 'Pending',

    // Providers view hints
    no_invoices_msg: 'No invoices found for this provider.',
    select_provider_hint: 'Select a provider above to view invoices',
  },

  ar: {
    // Splash
    please_wait: 'الرجاء الانتظار...',

    // Login
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    sign_in: 'تسجيل الدخول',

    // Navbar
    products: 'المنتجات',
    categories: 'الفئات',
    providers: 'الموردون',
    hold_orders: 'الطلبات المعلقة',
    orders: 'الطلبات',
    transactions: 'المعاملات',
    point_of_sale: 'نقطة البيع',
    users: 'المستخدمون',
    settings: 'الإعدادات',
    my_profile: 'ملفي الشخصي',
    sign_out: 'تسجيل الخروج',
    walk_in_customer: 'زبون عابر',

    // POS – Cart
    new_btn: 'جديد',
    scan_barcode: 'امسح الباركود أو أدخل الرمز...',
    search_products: 'ابحث بالاسم أو الرمز...',
    items: 'العناصر',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    total_tax_prefix: 'الإجمالي (شامل ',
    total_tax_suffix: '% ضريبة)',
    cancel: 'إلغاء',
    hold_btn: 'تعليق',
    pay_now: 'ادفع الآن',

    // Cart table headers
    cart_hash: '#',
    cart_item: 'الصنف',
    cart_qty: 'الكمية',
    cart_price: 'السعر',

    // Transactions view
    sales: 'المبيعات',
    total_transactions: 'المعاملات',
    items_sold: 'عناصر مباعة',
    total_products: 'المنتجات',
    till: 'الصراف',
    cashier: 'أمين الصندوق',
    status: 'الحالة',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    date: 'التاريخ',
    products_title: 'المنتجات',
    name_col: 'الاسم',
    sold_col: 'مباع',
    available_col: 'متاح',
    sales_col: 'المبيعات',
    trans_details: 'تفاصيل المعاملات',
    invoice_col: 'الفاتورة',
    date_col: 'التاريخ',
    total_col: 'الإجمالي',
    paid_col: 'مدفوع',
    change_col: 'المتبقي',
    method_col: 'الطريقة',
    till_col: 'الصراف',
    cashier_col: 'الكاشير',
    view_col: 'عرض',
    products: 'المنتجات',

    // Hold Order Modal
    hold_order: 'تعليق الطلب',
    enter_reference: 'أدخل مرجعاً',
    hold_order_btn: 'تعليق الطلب',

    // Payment Modal
    payment: 'الدفع',
    price_label: 'السعر',
    payment_label: 'الدفع',
    cash: 'نقد',
    card: 'بطاقة',
    card_info: 'معلومات البطاقة',
    change: 'المتبقي',
    confirm_payment: 'تأكيد الدفع',

    // New Customer
    new_customer: 'عميل جديد',
    customer_name_lbl: 'اسم العميل*',
    phone_lbl: 'الهاتف',
    email_lbl: 'البريد الإلكتروني',
    address_lbl: 'العنوان',
    enter_name: 'أدخل الاسم',
    phone_placeholder: 'رقم الهاتف',
    email_placeholder: 'البريد الإلكتروني',
    address_placeholder: 'العنوان',

    // Add / Modify Product
    add_modify_product: 'إضافة / تعديل منتج',
    category_lbl: 'الفئة',
    barcode_lbl: 'الباركود',
    cost_price_lbl: 'سعر التكلفة',
    provider_lbl: 'المورد',
    provider_modal: 'مورد',
    providers_modal: 'الموردون',
    provider_name_placeholder: 'اسم المورد',
    filter_by_provider_lbl: 'تصفية حسب المورد',
    all_providers_opt: 'جميع الموردين',
    total_cost: 'إجمالي التكلفة',
    total_profit: 'الربح',
    expiry_date_lbl: 'تاريخ الانتهاء',
    min_stock_lbl: 'الحد الأدنى للمخزون',
    disable_stock_lbl: 'تعطيل فحص المخزون',
    product_name_lbl: 'اسم المنتج',
    profit_margin_lbl: 'هامش الربح',
    sale_price_lbl: 'سعر البيع',
    quantity_lbl: 'الكمية',
    invoice_id_lbl: 'رقم الفاتورة',
    entry_date_lbl: 'تاريخ الإدخال',
    remove_lbl: 'حذف',
    picture_lbl: 'صورة',

    // Category Modal
    category_modal: 'الفئة',
    name_lbl: 'الاسم',
    category_name_placeholder: 'اسم الفئة',
    select_category: 'اختر',

    // Products List Modal
    products_modal: 'المنتجات',
    barcode_col: 'الباركود',
    price_col: 'السعر',
    cost_price_col: 'سعر التكلفة',
    qty_col: 'الكمية',
    category_col: 'الفئة',
    action_col: 'إجراء',
    STOCK: 'متوفر',

    // Users Modal
    users_modal: 'المستخدمون',
    username_col: 'اسم المستخدم',
    status_col: 'الحالة',

    // Categories Modal
    categories_modal: 'الفئات',

    // User Account Modal
    account_info: 'معلومات الحساب',
    full_name_lbl: 'الاسم*',
    username_lbl: 'اسم المستخدم*',
    password_lbl: 'كلمة المرور',
    repeat_password_lbl: 'تكرار كلمة المرور',
    full_name_placeholder: 'الاسم الكامل',
    username_placeholder: 'اسم المستخدم',
    password_placeholder: 'كلمة المرور',
    repeat_placeholder: 'تكرار',
    permissions: 'الصلاحيات',
    perm_products: 'إدارة المنتجات والمخزون',
    perm_categories: 'إدارة فئات المنتجات',
    perm_transactions: 'عرض المعاملات',
    perm_users: 'إدارة المستخدمين والصلاحيات',
    perm_settings: 'إدارة الإعدادات',

    // Hold Orders Modal
    open_orders: 'الطلبات المفتوحة',
    search_order: 'البحث عن طلب بالمرجع',

    // Customer Orders Modal
    customer_orders: 'طلبات العميل',
    search_customer: 'البحث باسم العميل',

    // View Order Modal
    print_btn: 'طباعة',
    reload_tip: 'انقر بالزر الأيمن وأعد التحميل إذا توقفت بعد إلغاء الطباعة.',

    // Settings Modal
    settings_modal: 'الإعدادات',
    app_mode: 'وضع التطبيق',
    standalone_pos: 'نقطة بيع مستقلة',
    network_terminal: 'طرفية نقطة بيع شبكية',
    network_server: 'خادم نقطة بيع شبكية',
    server_ip_lbl: 'عنوان IP الخادم*',
    till_number_lbl: 'رقم الصراف*',
    hardware_id_lbl: 'معرّف الجهاز',
    save_settings_val: 'حفظ الإعدادات',
    store_name_lbl: 'اسم المتجر',
    addr_line_1_lbl: 'العنوان - السطر الأول',
    contact_lbl: 'رقم الاتصال',
    vat_number_lbl: 'رقم ضريبة القيمة المضافة',
    footer_lbl: 'تذييل الإيصال',
    currency_lbl: 'رمز العملة',
    addr_line_2_lbl: 'العنوان - السطر الثاني',
    vat_pct_lbl: 'نسبة ضريبة القيمة المضافة',
    charge_vat_lbl: 'احتساب ضريبة القيمة المضافة',
    logo_lbl: 'شعار الصيدلية',
    logo_note: 'الحد الأقصى 2 ميجابايت · jpeg، jpg، png، webp',
    upload_products_h4: 'رفع ملف المنتجات',
    upload_btn: 'رفع المنتجات',

    //Providers
    provider_info: 'معلومات المورد',
    provider_name_lbl: 'اسم المورد',
    provider_phone_lbl: 'الهاتف',
    provider_email_lbl: 'البريد الإلكتروني',
    provider_name_placeholder: 'اسم المورد',
    provider_balance_lbl: 'المبالغ المعلقة',
    invoice_list: 'قائمة الفواتير',

    // Invoice columns & form
    invoice_issue_date: 'تاريخ الفاتورة',
    invoice_amount_lbl: 'المبلغ',
    invoice_number_of_items_lbl: '#العناصر',
    due_date_lbl: 'تاريخ الاستحقاق',
    net_amount_lbl: 'المبلغ الصافي',
    total_amount_lbl: 'المبلغ الإجمالي',
    tax_amount_lbl: 'مبلغ الضريبة',
    discount_amount_lbl: 'الخصم',
    payment_status_lbl: 'الحالة',
    notes_lbl: 'ملاحظات',
    invoice_photo_lbl: 'صورة الفاتورة / PDF',
    invoice_file_note: 'الحد الأقصى 10 ميجابايت · pdf، jpg، png',
    invoice_id_auto_hint: 'يُولَّد تلقائياً إذا تُرك فارغاً',

    // Invoice status badges
    status_paid: 'مدفوع',
    status_pending: 'معلق',
    status_overdue: 'متأخر',

    // Invoice actions / modal
    add_invoice_btn: 'إضافة فاتورة',
    add_invoice_title: 'إضافة فاتورة',
    edit_invoice_title: 'تعديل الفاتورة',
    current_file_lbl: 'الملف المرفق',
    replace_file_lbl: 'استبدال بملف جديد (اختياري)',
    invoices_nav_btn: 'الفواتير',
    inv_search_id_placeholder: 'بحث برقم الفاتورة...',
    inv_all_providers: 'جميع الموردين',
    inv_all_statuses: 'جميع الحالات',
    inv_date_from: 'من',
    inv_date_to: 'إلى',
    inv_amount_min: 'أدنى',
    inv_amount_max: 'أقصى',
    inv_detail_title: 'تفاصيل الفاتورة',
    inv_linked_products: 'المنتجات المرتبطة',
    inv_click_hint: 'اختر فاتورة لعرض تفاصيلها والمنتجات المرتبطة',
    inv_no_results: 'لا توجد فواتير تطابق البحث',
    inv_no_linked_products: 'لا توجد منتجات مرتبطة بهذه الفاتورة',
    payment_history_lbl: 'سجل المدفوعات',
    add_payment_btn: 'إضافة دفعة',
    add_payment_title: 'إضافة دفعة',
    edit_payment_title: 'تعديل الدفعة',
    save_payment_btn: 'حفظ الدفعة',
    pay_stat_invoiced: 'إجمالي الفواتير',
    pay_stat_paid: 'إجمالي المدفوعات',
    pay_stat_balance: 'الرصيد المتبقي',
    pay_stat_count: 'عدد الدفعات',
    pay_date_lbl: 'التاريخ',
    pay_amount_lbl: 'المبلغ',
    pay_method_lbl: 'طريقة الدفع',
    pay_reference_lbl: 'المرجع / رقم الشيك',
    pay_running_balance_lbl: 'الرصيد الجاري',
    pay_method_cash: 'نقداً',
    pay_method_bank: 'تحويل بنكي',
    pay_method_check: 'شيك',
    pay_method_other: 'أخرى',
    save_invoice_btn: 'حفظ الفاتورة',
    mark_as_paid_btn: 'تحديد كمدفوع',
    view_invoice_lbl: 'معاينة الفاتورة',
    open_externally_btn: 'فتح في المشغّل',
    close_btn: 'إغلاق',
    pdf_open_hint: 'انقر على "فتح في المشغّل" لعرض ملف PDF.',

    // Invoice stats cards
    stat_total_invoices: 'إجمالي الفواتير',
    stat_total_amount: 'إجمالي المبلغ',
    stat_paid_amount: 'مدفوع',
    stat_pending_amount: 'معلق',

    // Providers view hints
    no_invoices_msg: 'لا توجد فواتير لهذا المورد.',
    select_provider_hint: 'اختر موردًا أعلاه لعرض الفواتير',
  }
};

var currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('pharma_lang')) || 'en';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) ||
         (translations['en'] && translations['en'][key]) ||
         key;
}

function applyLanguage(lang) {
  currentLang = lang;
  var isRtl = lang === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-value]').forEach(function(el) {
    el.value = t(el.getAttribute('data-i18n-value'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.title = t(el.getAttribute('data-i18n-title'));
  });

  var btn = document.getElementById('langToggle');
  if (btn) btn.textContent = isRtl ? 'EN' : 'عربي';

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pharma_lang', lang);
  }
}

$(document).ready(function() {
  applyLanguage(currentLang);
  $(document).on('click', '#langToggle', function() {
    applyLanguage(currentLang === 'en' ? 'ar' : 'en');
  });
});

module.exports = { t: t, applyLanguage: applyLanguage, getCurrentLang: function() { return currentLang; } };
