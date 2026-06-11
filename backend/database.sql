-- Create Database
CREATE DATABASE IF NOT EXISTS staybillpro;
USE staybillpro;

-- Admins/Users Table (Profiles)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_admin_id INT DEFAULT NULL, -- For linking staff to a business
    branch_id INT DEFAULT NULL,      -- For linking staff to a branch
    business_name VARCHAR(255),
    admin_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('SUPERADMIN', 'USER') DEFAULT 'SUPERADMIN',
    base_salary DECIMAL(10, 2) DEFAULT 0.00,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    business_type VARCHAR(100),
    gst_number VARCHAR(20),
    logo_url LONGTEXT,
    bank_name VARCHAR(255),
    bank_account VARCHAR(100),
    ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    current_plan ENUM('Starter', 'Professional', 'Enterprise') DEFAULT 'Starter',
    features VARCHAR(50) DEFAULT 'Both Features',
    eula_accepted BOOLEAN DEFAULT FALSE,
    subscription_expiry DATETIME,
    scan_wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_wallet_recharge_date DATE DEFAULT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    permissions TEXT DEFAULT NULL, -- JSON string of accessible screen IDs
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Subscriptions Table (Payments & Validity History)
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    plan_name VARCHAR(50) NOT NULL,
    features VARCHAR(50) DEFAULT 'Both Features',
    amount DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_paid DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100),
    payment_status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
    start_date DATETIME,
    expiry_date DATETIME,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Wallet Transactions Table (Ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    type ENUM('recharge', 'deduction', 'auto_recharge') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT, -- Optional: if categories are branch-specific
    name VARCHAR(100) NOT NULL,
    type ENUM('sales', 'service', 'both') DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE KEY unique_admin_category_type (admin_id, name, type)
);

-- Units Table
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_unit (admin_id, name)
);

-- Sales Inventory Table
CREATE TABLE IF NOT EXISTS sales_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    sku VARCHAR(100),
    hsn_code VARCHAR(20),
    unit VARCHAR(50) DEFAULT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 18.0,
    serial_number VARCHAR(100),
    dimensions VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(10, 2) DEFAULT 0.00,
    purchase_price DECIMAL(10, 2) DEFAULT 0.00,
    wholesale_price DECIMAL(10, 2) DEFAULT NULL,
    min_wholesale_qty DECIMAL(10,3) DEFAULT NULL,
    quantity DECIMAL(10,3) DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('available', 'unavailable', 'out_of_stock') DEFAULT 'available',
    expiry_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Service Inventory (Spare Parts) Table
CREATE TABLE IF NOT EXISTS service_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    part_number VARCHAR(100),
    hsn_code VARCHAR(20),
    unit VARCHAR(50) DEFAULT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 18.0,
    serial_number VARCHAR(100),
    dimensions VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(10, 2) DEFAULT 0.00,
    purchase_price DECIMAL(10, 2) DEFAULT 0.00,
    wholesale_price DECIMAL(10, 2) DEFAULT NULL,
    min_wholesale_qty DECIMAL(10,3) DEFAULT NULL,
    quantity DECIMAL(10,3) DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('available', 'unavailable', 'out_of_stock') DEFAULT 'available',
    expiry_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Stock Log Table (History of movements)
CREATE TABLE IF NOT EXISTS stock_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    item_id INT NOT NULL,
    item_type ENUM('sales', 'service') NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    change_type ENUM('in', 'out', 'adjustment', 'initial') NOT NULL,
    quantity_changed DECIMAL(10,3) NOT NULL,
    resulting_quantity DECIMAL(10,3) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Add foreign key to admins table after branches table exists
ALTER TABLE admins ADD FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Stock Transfer Table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL, -- Business owner ID
    from_branch_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
    notes TEXT,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES sales_inventory(id) ON DELETE CASCADE
);

-- Invoices Table (Sales)
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    gst_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    payment_method ENUM('cash', 'card', 'upi', 'credit') DEFAULT 'cash',
    status ENUM('paid', 'pending', 'cancelled') DEFAULT 'paid',
    invoice_type VARCHAR(50) DEFAULT 'pos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT,
    item_name VARCHAR(255),
    quantity DECIMAL(10,3) DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total_price DECIMAL(15, 2) DEFAULT 0.00,
    gst_rate DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    category VARCHAR(100), -- Rent, Electricity, Salaries, etc.
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    payment_mode ENUM('cash', 'bank') DEFAULT 'cash',
    expense_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Supplier Payments Table
CREATE TABLE IF NOT EXISTS supplier_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Ledger Table (General Ledger & Cash/Bank Registers)
CREATE TABLE IF NOT EXISTS ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    account_type ENUM('cash', 'bank') DEFAULT 'cash',
    transaction_type ENUM('receipt', 'payment', 'initial', 'transfer') NOT NULL,
    voucher_no VARCHAR(50),
    particulars TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    transaction_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150),
    mobile VARCHAR(20) NOT NULL,
    category VARCHAR(100) DEFAULT 'Retail',
    customerType VARCHAR(100) DEFAULT 'Consumer',
    gstin VARCHAR(50),
    billingAddress TEXT,
    shippingAddress TEXT,
    sameAsBilling BOOLEAN DEFAULT TRUE,
    openingBalance DECIMAL(15, 2) DEFAULT 0.00,
    balanceType VARCHAR(50) DEFAULT 'receivable',
    asOfDate DATE,
    creditLimit DECIMAL(15, 2) DEFAULT 0.00,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    customer_type ENUM('Regular', 'Premium', 'VIP') DEFAULT 'Regular',
    notes TEXT,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    supplier_code VARCHAR(50),
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    mobile VARCHAR(20) NOT NULL,
    alternate_mobile VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(255),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(15),
    country VARCHAR(100) DEFAULT 'India',
    gstin VARCHAR(20),
    pan_no VARCHAR(20),
    business_type ENUM('Manufacturer', 'Wholesaler', 'Distributor', 'Retailer') DEFAULT 'Manufacturer',
    registration_no VARCHAR(100),
    opening_balance DECIMAL(15, 2) DEFAULT 0.00,
    balance_type ENUM('Payable', 'Advance') DEFAULT 'Payable',
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    payment_terms_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    supplier_id INT DEFAULT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    bill_number VARCHAR(100),
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    gst_amount DECIMAL(15, 2) DEFAULT 0.00,
    purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- POS Settings Table
CREATE TABLE IF NOT EXISTS pos_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    shop_name VARCHAR(255),
    gstin VARCHAR(50),
    theme VARCHAR(50) DEFAULT 'light',
    print_size VARCHAR(50) DEFAULT '80mm',
    wholesale_print_size VARCHAR(50) DEFAULT 'A4',
    auto_print BOOLEAN DEFAULT TRUE,
    enable_gst BOOLEAN DEFAULT TRUE,
    inclusive_gst BOOLEAN DEFAULT FALSE,
    show_hsn BOOLEAN DEFAULT TRUE,
    default_gst_preset INT DEFAULT 18,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_settings (branch_id)
);

-- Sales Returns Table
CREATE TABLE IF NOT EXISTS sales_returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    invoice_id INT NOT NULL,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount DECIMAL(15, 2) DEFAULT 0.00,
    payment_method ENUM('cash', 'card', 'upi', 'credit') DEFAULT 'cash',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Sales Return Items Table
CREATE TABLE IF NOT EXISTS sales_return_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    product_id INT,
    item_name VARCHAR(255),
    quantity DECIMAL(10,3) DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    refund_price DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE
);

-- Staff Attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    staff_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Half Day') DEFAULT 'Present',
    check_in TIME,
    check_out TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_date (staff_id, date)
);

-- Staff Payroll Table
CREATE TABLE IF NOT EXISTS staff_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    staff_id INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- e.g. '2026-06'
    base_salary DECIMAL(15, 2) DEFAULT 0.00,
    allowances DECIMAL(15, 2) DEFAULT 0.00,
    deductions DECIMAL(15, 2) DEFAULT 0.00,
    net_payable DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    payment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_month (staff_id, month)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    po_number VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('Pending', 'Received', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total_price DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- Goods Received Notes (GRN) Table
CREATE TABLE IF NOT EXISTS grns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT NOT NULL,
    po_id INT,
    grn_number VARCHAR(100) NOT NULL,
    grn_date DATE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    warehouse VARCHAR(100) DEFAULT 'Main Warehouse',
    status ENUM('Stocked', 'Pending QA', 'Rejected') DEFAULT 'Stocked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
);

-- GRN Items Table
CREATE TABLE IF NOT EXISTS grn_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grn_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_received DECIMAL(10,3) DEFAULT 1,
    damaged_quantity DECIMAL(10,3) DEFAULT 0,
    return_status ENUM('Pending', 'Returned') DEFAULT 'Pending',
    return_date DATE NULL,
    mapped_inventory_id INT NULL,
    inventory_type ENUM('sales', 'service') DEFAULT 'sales',
    pushed_to_stock BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE
);
