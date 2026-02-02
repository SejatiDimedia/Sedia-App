-- Create sedia_pos schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS sedia_pos;

-- Create outlets table
CREATE TABLE IF NOT EXISTS sedia_pos.outlets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS sedia_pos.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS sedia_pos.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    category_id TEXT REFERENCES sedia_pos.categories(id),
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    price NUMERIC(15,2) NOT NULL,
    cost_price NUMERIC(15,2) DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    track_stock BOOLEAN DEFAULT true,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS sedia_pos.customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS sedia_pos.transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    invoice_number TEXT NOT NULL,
    customer_id TEXT REFERENCES sedia_pos.customers(id),
    cashier_id TEXT,
    subtotal NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0,
    tax NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'paid',
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS sedia_pos.transaction_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id TEXT NOT NULL REFERENCES sedia_pos.transactions(id),
    product_id TEXT REFERENCES sedia_pos.products(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    cost_price NUMERIC(15,2),
    discount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL
);

-- Create employees table
CREATE TABLE IF NOT EXISTS sedia_pos.employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    user_id TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    pin_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS sedia_pos.inventory_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    outlet_id TEXT NOT NULL REFERENCES sedia_pos.outlets(id),
    product_id TEXT NOT NULL REFERENCES sedia_pos.products(id),
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Insert default outlet for testing
INSERT INTO sedia_pos.outlets (id, name, address, owner_id)
VALUES ('default-outlet', 'Outlet Utama', 'Jl. Contoh No. 1', 'system')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products for testing
INSERT INTO sedia_pos.products (id, outlet_id, name, price, stock, is_active)
VALUES 
    ('prod-1', 'default-outlet', 'Kopi Susu', 18000, 50, true),
    ('prod-2', 'default-outlet', 'Es Teh Manis', 8000, 100, true),
    ('prod-3', 'default-outlet', 'Nasi Goreng', 25000, 30, true),
    ('prod-4', 'default-outlet', 'Mie Goreng', 22000, 25, true),
    ('prod-5', 'default-outlet', 'Ayam Geprek', 28000, 20, true),
    ('prod-6', 'default-outlet', 'Es Jeruk', 10000, 80, true),
    ('prod-7', 'default-outlet', 'Roti Bakar', 15000, 40, true),
    ('prod-8', 'default-outlet', 'Susu Coklat', 12000, 35, true)
ON CONFLICT (id) DO NOTHING;
