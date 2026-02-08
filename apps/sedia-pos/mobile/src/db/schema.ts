import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Local Products Table (mirrors backend sedia_pos.products)
export const localProducts = sqliteTable("products", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    sku: text("sku"),
    price: real("price").notNull(),
    costPrice: real("cost_price"),
    stock: integer("stock").default(0),
    categoryId: text("category_id"),
    outletId: text("outlet_id"),
    imageUrl: text("image_url"),
    syncedAt: integer("synced_at", { mode: "timestamp" }),
});

// Local Product Variants Table
export const localProductVariants = sqliteTable("product_variants", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .references(() => localProducts.id),
    name: text("name").notNull(),
    sku: text("sku"),
    priceAdjustment: text("price_adjustment").notNull(), // stored as string to match backend numeric
    stock: integer("stock").default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    syncedAt: integer("synced_at", { mode: "timestamp" }),
});

// Local Customers Table
export const localCustomers = sqliteTable("customers", {
    id: text("id").primaryKey(),
    outletId: text("outlet_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    points: integer("points").default(0),
    totalSpent: text("total_spent").default("0"),
    syncedAt: integer("synced_at", { mode: "timestamp" }),
});

// Local Transactions Table (for offline-first)
export const localTransactions = sqliteTable("transactions", {
    id: text("id").primaryKey(),
    outletId: text("outlet_id").notNull(),
    customerId: text("customer_id"),
    employeeId: text("employee_id"),
    totalAmount: real("total_amount").notNull(),
    paymentMethod: text("payment_method").default("cash"),
    midtransId: text("midtrans_id"),
    status: text("status").default("pending"), // pending, synced, failed
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    syncStatus: text("sync_status").default("pending"), // pending, synced, error
});

// Local Transaction Items Table
export const localTransactionItems = sqliteTable("transaction_items", {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
        .notNull()
        .references(() => localTransactions.id),
    productId: text("product_id")
        .notNull()
        .references(() => localProducts.id),
    variantId: text("variant_id"), // Nullable
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    subtotal: real("subtotal").notNull(),
});

export const localTransactionPayments = sqliteTable("transaction_payments", {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
        .notNull()
        .references(() => localTransactions.id),
    paymentMethod: text("payment_method").notNull(),
    amount: real("amount").notNull(),
    referenceNumber: text("reference_number"),
    externalId: text("external_id"), // Midtrans ID, etc
});

// Export types for TypeScript
export type LocalProduct = typeof localProducts.$inferSelect;
export type LocalProductVariant = typeof localProductVariants.$inferSelect;
export type LocalCustomer = typeof localCustomers.$inferSelect;
export type LocalTransaction = typeof localTransactions.$inferSelect;
export type LocalTransactionItem = typeof localTransactionItems.$inferSelect;
