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
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    business_type VARCHAR(100),
    gst_number VARCHAR(20),
    current_plan ENUM('Starter', 'Professional', 'Enterprise') DEFAULT 'Starter',
    subscription_expiry DATETIME,
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
    gst_rate DECIMAL(5, 2) DEFAULT 18.0,
    serial_number VARCHAR(100),
    dimensions VARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0.00,
    purchase_price DECIMAL(10, 2) DEFAULT 0.00,
    quantity INT DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('available', 'unavailable', 'out_of_stock') DEFAULT 'available',
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
    gst_rate DECIMAL(5, 2) DEFAULT 18.0,
    serial_number VARCHAR(100),
    dimensions VARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0.00,
    purchase_price DECIMAL(10, 2) DEFAULT 0.00,
    quantity INT DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL,
    status ENUM('available', 'unavailable', 'out_of_stock') DEFAULT 'available',
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
    quantity_changed INT NOT NULL,
    resulting_quantity INT NOT NULL,
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
    quantity INT NOT NULL,
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
    quantity INT DEFAULT 1,
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total_price DECIMAL(15, 2) DEFAULT 0.00,
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
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(150),
    mobile VARCHAR(20) NOT NULL,
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

