import { pgSchema, text, timestamp, integer, boolean, numeric, uuid, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./auth-schema";

// ============================================
// SEDIA POS - Point of Sales Schema
// ============================================

export const sediaPos = pgSchema("sedia_pos");

// ============================================
// Core Tables
// ============================================

export const outlets = sediaPos.table("outlets", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    qrisImageUrl: text("qris_image_url"),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").default("#2e6a69"),
    secondaryColor: text("secondary_color").default("#f2b30c"),
    openTime: text("open_time"),
    closeTime: text("close_time"),
    greeting: text("greeting"),
    isCatalogVisible: boolean("is_catalog_visible").default(true),
    ownerId: text("owner_id").notNull(), // Links to authSchema.user
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const paymentMethods = sediaPos.table("payment_methods", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").references(() => outlets.id),
    name: text("name").notNull(), // e.g., "Cash", "QRIS", "Transfer BCA"
    type: text("type").notNull().default("cash"), // 'cash', 'qris', 'transfer', 'ewallet', 'card'
    isActive: boolean("is_active").default(true),
    isManual: boolean("is_manual").default(false),
    bankName: text("bank_name"), // Legacy single field
    accountNumber: text("account_number"), // Legacy single field
    accountHolder: text("account_holder"), // Legacy single field
    bankAccounts: jsonb("bank_accounts").$type<{ bankName: string; accountNumber: string; accountHolder: string }[]>(),
    qrisData: text("qris_data"),
    qrisImageUrl: text("qris_image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = sediaPos.table("categories", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id").notNull(), // Master data owned by user/owner
    outletId: text("outlet_id").references(() => outlets.id), // Nullable = shared/master
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const products = sediaPos.table("products", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    categoryId: text("category_id").references(() => categories.id),
    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    price: numeric("price", { precision: 15, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 15, scale: 2 }).default("0"),
    stock: integer("stock").notNull().default(0),
    trackStock: boolean("track_stock").default(true),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true),
    isFeatured: boolean("is_featured").default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productVariants = sediaPos.table("product_variants", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., "Small", "Medium", "Large"
    type: text("type").notNull().default("size"), // 'size', 'color', 'option'
    priceAdjustment: numeric("price_adjustment", { precision: 15, scale: 2 }).default("0"),
    stock: integer("stock").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventoryLogs = sediaPos.table("inventory_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    type: text("type").notNull(), // 'in', 'out', 'adjustment', 'sale', 'refund'
    quantity: integer("quantity").notNull(), // Positive or negative
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").notNull(), // Employee or Owner ID
});

// ============================================
// Sales & Customers (CRM/Loyalty)
// ============================================

// Member Tiers for loyalty program
export const memberTiers = sediaPos.table("member_tiers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    name: text("name").notNull(), // 'Bronze', 'Silver', 'Gold', 'Platinum'
    minPoints: integer("min_points").notNull().default(0), // Minimum points to reach this tier
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"), // e.g., 5.00 = 5%
    pointMultiplier: numeric("point_multiplier", { precision: 3, scale: 2 }).default("1.00"), // e.g., 1.5x points
    color: text("color").default("#6b7280"), // Badge color
    isDefault: boolean("is_default").default(false), // Default tier for new members
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = sediaPos.table("customers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    tierId: text("tier_id").references(() => memberTiers.id), // Member tier
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    points: integer("points").default(0),
    totalSpent: numeric("total_spent", { precision: 15, scale: 2 }).default("0"),
    memberSince: timestamp("member_since").defaultNow(), // When they became a member
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Point history for audit trail
export const pointTransactions = sediaPos.table("point_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    customerId: text("customer_id").notNull().references(() => customers.id),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    transactionId: text("transaction_id"), // Optional: linked sale transaction
    type: text("type").notNull(), // 'earn', 'redeem', 'adjust', 'expire'
    points: integer("points").notNull(), // Positive for earn, negative for redeem
    description: text("description"), // e.g., "Points from purchase", "Redeemed for discount"
    createdBy: text("created_by"), // Employee/User who made the adjustment
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loyalty settings per outlet
export const loyaltySettings = sediaPos.table("loyalty_settings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id).unique(),
    pointsPerAmount: integer("points_per_amount").default(1), // Points earned per X amount
    amountPerPoint: integer("amount_per_point").default(1000), // Amount in IDR per point. e.g., 1 point per Rp 1.000
    redemptionRate: integer("redemption_rate").default(100), // Points needed per redemption
    redemptionValue: integer("redemption_value").default(10000), // Value in IDR. e.g., 100 points = Rp 10.000
    isEnabled: boolean("is_enabled").default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const transactions = sediaPos.table("transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    invoiceNumber: text("invoice_number").notNull(),
    customerId: text("customer_id").references(() => customers.id),
    cashierId: text("cashier_id"), // Employee ID or User ID (owner)

    // Financials
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 15, scale: 2 }).default("0"),
    tax: numeric("tax", { precision: 15, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),

    paymentMethod: text("payment_method").notNull(), // 'cash', 'qris', 'transfer'
    paymentStatus: text("payment_status").notNull().default("paid"), // 'pending', 'paid', 'cancelled'

    status: text("status").notNull().default("completed"), // 'completed', 'refunded', 'void'
    midtransId: text("midtrans_id").unique(),
    paymentUrl: text("payment_url"),
    notes: text("notes"),
    customerName: text("customer_name"), // Added to support WA orders and walk-ins
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionItems = sediaPos.table("transaction_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    transactionId: text("transaction_id").notNull().references(() => transactions.id),
    productId: text("product_id").references(() => products.id),
    productName: text("product_name").notNull(), // Store name snapshop in case product is deleted
    productSku: text("product_sku"),
    variantId: text("variant_id"),
    variantName: text("variant_name"),

    quantity: integer("quantity").notNull(),
    price: numeric("price", { precision: 15, scale: 2 }).notNull(), // Price at the time of sale
    costPrice: numeric("cost_price", { precision: 15, scale: 2 }), // For profit calculation
    discount: numeric("discount", { precision: 15, scale: 2 }).default("0"),
    total: numeric("total", { precision: 15, scale: 2 }).notNull(),
});

// ============================================
// Staff Management
// ============================================

export const roles = sediaPos.table("roles", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").references(() => outlets.id), // Nullable for system roles
    name: text("name").notNull(),
    description: text("description"),
    permissions: text("permissions").notNull(), // JSON string, e.g. ["access_pos", "manage_products"]
    isSystem: boolean("is_system").default(false), // System roles cannot be deleted
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const employees = sediaPos.table("employees", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").references(() => outlets.id), // DEPRECATED: use employeeOutlets for multi-outlet
    userId: text("user_id"), // Optional: if employee has login access
    roleId: text("role_id").references(() => roles.id), // Link to dynamic role
    name: text("name").notNull(),
    role: text("role").notNull().default("cashier"), // Deprecated/Fallback: 'manager', 'cashier'
    pinCode: text("pin_code"), // Simple PIN for POS access
    isActive: boolean("is_active").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false), // Soft delete flag
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Junction table for many-to-many employee-outlet relationship
export const employeeOutlets = sediaPos.table("employee_outlets", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    outletId: text("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false), // Primary/default outlet for this employee
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shifts = sediaPos.table("shifts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").references(() => outlets.id),
    employeeId: text("employee_id").references(() => employees.id),
    startTime: timestamp("start_time").notNull().defaultNow(),
    endTime: timestamp("end_time"), // Null means shift is open
    startingCash: numeric("starting_cash", { precision: 15, scale: 2 }).notNull(), // Modal awal
    endingCash: numeric("ending_cash", { precision: 15, scale: 2 }), // Uang fisik di laci saat tutup
    expectedCash: numeric("expected_cash", { precision: 15, scale: 2 }), // Hitungan sistem
    difference: numeric("difference", { precision: 15, scale: 2 }), // Selisih (ending - expected)
    status: text("status").notNull().default("open"), // 'open', 'closed'
    notes: text("notes"), // Catatan saat closing
});


// ============================================
// Tax Settings
// ============================================

export const taxSettings = sediaPos.table("tax_settings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id).unique(),
    name: text("name").notNull().default("PPN"),
    rate: numeric("rate", { precision: 5, scale: 2 }).notNull().default("0"),
    type: text("type").notNull().default("percentage"), // 'percentage', 'fixed'
    isEnabled: boolean("is_enabled").notNull().default(false),
    isInclusive: boolean("is_inclusive").notNull().default(false), // Harga sudah termasuk pajak
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});


// ============================================
// Suppliers & Purchasing
// ============================================

export const suppliers = sediaPos.table("suppliers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const purchaseOrders = sediaPos.table("purchase_orders", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    invoiceNumber: text("invoice_number").notNull(),
    status: text("status", { enum: ["draft", "ordered", "received", "cancelled"] }).default("draft").notNull(),
    totalAmount: integer("total_amount").notNull().default(0),
    orderDate: timestamp("order_date").defaultNow(),
    expectedDate: timestamp("expected_date"),
    receivedDate: timestamp("received_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const purchaseOrderItems = sediaPos.table("purchase_order_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id), // Nullable for product without variant
    quantity: integer("quantity").notNull(),
    costPrice: integer("cost_price").notNull(), // Cost per unit
    subtotal: integer("subtotal").notNull(), // quantity * costPrice
    createdAt: timestamp("created_at").notNull().defaultNow(),
});


// ============================================
// Relations
// ============================================

export const outletsRelations = relations(outlets, ({ one, many }) => ({
    owner: one(user, {
        fields: [outlets.ownerId],
        references: [user.id],
    }),
    products: many(products),
    transactions: many(transactions),
    employees: many(employees),
    roles: many(roles),
    employeeOutlets: many(employeeOutlets),
    taxSettings: one(taxSettings, {
        fields: [outlets.id],
        references: [taxSettings.outletId],
    }),
    suppliers: many(suppliers),
    purchaseOrders: many(purchaseOrders),
    visitorLogs: many(visitorLogs),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [suppliers.outletId],
        references: [outlets.id],
    }),
    purchaseOrders: many(purchaseOrders),
}));

export const taxSettingsRelations = relations(taxSettings, ({ one }) => ({
    outlet: one(outlets, {
        fields: [taxSettings.outletId],
        references: [outlets.id],
    }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [roles.outletId],
        references: [outlets.id],
    }),
    employees: many(employees),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [categories.outletId],
        references: [outlets.id],
    }),
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [products.outletId],
        references: [outlets.id],
    }),
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    logs: many(inventoryLogs),
    variants: many(productVariants),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [transactions.outletId],
        references: [outlets.id],
    }),
    customer: one(customers, {
        fields: [transactions.customerId],
        references: [customers.id],
    }),
    items: many(transactionItems),
    payments: many(transactionPayments),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
    transaction: one(transactions, {
        fields: [transactionItems.transactionId],
        references: [transactions.id],
    }),
    product: one(products, {
        fields: [transactionItems.productId],
        references: [products.id],
    }),
}));

export const transactionPayments = sediaPos.table("transaction_payments", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    transactionId: text("transaction_id").notNull().references(() => transactions.id),
    paymentMethod: text("payment_method").notNull(), // 'cash', 'qris', 'transfer', 'edc'
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    referenceNumber: text("reference_number"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionPaymentsRelations = relations(transactionPayments, ({ one }) => ({
    transaction: one(transactions, {
        fields: [transactionPayments.transactionId],
        references: [transactions.id],
    }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [employees.outletId],
        references: [outlets.id],
    }),
    roleData: one(roles, {
        fields: [employees.roleId],
        references: [roles.id],
    }),
    employeeOutlets: many(employeeOutlets),
}));

export const employeeOutletsRelations = relations(employeeOutlets, ({ one }) => ({
    employee: one(employees, {
        fields: [employeeOutlets.employeeId],
        references: [employees.id],
    }),
    outlet: one(outlets, {
        fields: [employeeOutlets.outletId],
        references: [outlets.id],
    }),
}));

// ============================================
// Stock Opname (Physical Stock Counting)
// ============================================

export const heldOrders = sediaPos.table("held_orders", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    cashierId: text("cashier_id"),
    customerId: text("customer_id").references(() => customers.id),
    customerName: text("customer_name"), // Snapshot for display
    customerPhone: text("customer_phone"), // Snapshot for display
    items: text("items").notNull(), // JSON array of cart items
    notes: text("notes"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
    status: text("status").notNull().default("active"), // 'active', 'completed', 'cancelled'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stockOpnames = sediaPos.table("stock_opnames", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    status: text("status").notNull().default("pending"), // 'pending', 'completed', 'cancelled'
    date: timestamp("date").notNull().defaultNow(),
    notes: text("notes"),
    createdBy: text("created_by"), // Employee ID probably
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stockOpnameItems = sediaPos.table("stock_opname_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    opnameId: text("opname_id").notNull().references(() => stockOpnames.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    systemStock: integer("system_stock").notNull().default(0), // Snapshot at creation
    actualStock: integer("actual_stock"), // Input by user
    difference: integer("difference"), // actual - system
    notes: text("notes"),
});

export const backups = sediaPos.table("backups", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id),
    userId: text("user_id").notNull(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url"),
    fileSize: integer("file_size"),
    type: text("type").notNull(), // 'manual', 'auto', 'export'
    status: text("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
    metadata: text("metadata"), // JSON string for details like table counts
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = sediaPos.table("activity_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id"), // Can be null for system-wide/owner activities
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', etc.
    entityType: text("entity_type").notNull(), // 'PRODUCT', 'TRANSACTION', etc.
    entityId: text("entity_id"),
    description: text("description").notNull(),
    metadata: text("metadata"), // JSON string for detailed changes
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visitorLogs = sediaPos.table("visitor_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    outletId: text("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(), // Browser fingerprint or generated device ID
    visitDate: text("visit_date").notNull(), // ISO Date string YYYY-MM-DD
    city: text("city"),
    region: text("region"),
    country: text("country"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    uniqueDailyVisitIdx: uniqueIndex("visitor_logs_unique_daily_visit_idx").on(table.outletId, table.visitorId, table.visitDate),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
    opname: one(stockOpnames, {
        fields: [stockOpnameItems.opnameId],
        references: [stockOpnames.id],
    }),
    product: one(products, {
        fields: [stockOpnameItems.productId],
        references: [products.id],
    }),
}));

export const stockOpnamesRelations = relations(stockOpnames, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [stockOpnames.outletId],
        references: [outlets.id],
    }),
    items: many(stockOpnameItems),
}));

export const heldOrdersRelations = relations(heldOrders, ({ one }) => ({
    outlet: one(outlets, {
        fields: [heldOrders.outletId],
        references: [outlets.id],
    }),
    customer: one(customers, {
        fields: [heldOrders.customerId],
        references: [customers.id],
    }),
}));

export const backupsRelations = relations(backups, ({ one }) => ({
    outlet: one(outlets, {
        fields: [backups.outletId],
        references: [outlets.id],
    }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    outlet: one(outlets, {
        fields: [activityLogs.outletId],
        references: [outlets.id],
    }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    outlet: one(outlets, {
        fields: [purchaseOrders.outletId],
        references: [outlets.id],
    }),
    supplier: one(suppliers, {
        fields: [purchaseOrders.supplierId],
        references: [suppliers.id],
    }),
    items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderItems.purchaseOrderId],
        references: [purchaseOrders.id],
    }),
    product: one(products, {
        fields: [purchaseOrderItems.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [purchaseOrderItems.variantId],
        references: [productVariants.id],
    }),
}));

export const visitorLogsRelations = relations(visitorLogs, ({ one }) => ({
    outlet: one(outlets, {
        fields: [visitorLogs.outletId],
        references: [outlets.id],
    }),
}));
