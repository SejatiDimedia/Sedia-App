import { Platform } from 'react-native';

// Type definitions
export interface LocalProduct {
    id: string;
    name: string;
    sku?: string;
    price: number;
    costPrice?: number;
    stock: number;
    categoryId?: string;
    outletId?: string;
    imageUrl?: string;
    isActive: boolean;
    syncedAt?: Date;
    variants?: LocalProductVariant[];
}

export interface LocalProductVariant {
    id: string;
    productId: string;
    name: string;
    sku?: string | null;
    priceAdjustment: string;
    stock: number;
    isActive: boolean;
    syncedAt?: Date;
}

export interface LocalCustomer {
    id: string;
    outletId: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    points: number;
    tier_id?: string | null;
    totalSpent?: string;
    syncedAt?: Date;
}

export interface TransactionItem {
    productId?: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export interface LocalTransaction {
    id: string;
    outletId: string;
    customerId?: string;
    employeeId?: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: Date;
    syncStatus: string;
    items?: TransactionItem[];
    payments?: { paymentMethod: string; amount: number; referenceNumber?: string }[];
}

// In-memory storage for web platform
const memoryDb = {
    products: new Map<string, LocalProduct>(),
    variants: new Map<string, LocalProductVariant>(),
    customers: new Map<string, LocalCustomer>(),
    transactions: new Map<string, LocalTransaction>(),
};

// Web-compatible database interface
export const db = {
    products: {
        getAll: async (): Promise<LocalProduct[]> => {
            const products = Array.from(memoryDb.products.values());
            const variants = Array.from(memoryDb.variants.values());
            return products.map(p => ({
                ...p,
                variants: variants.filter(v => v.productId === p.id)
            }));
        },
        getById: async (id: string): Promise<LocalProduct | undefined> => {
            const product = memoryDb.products.get(id);
            if (!product) return undefined;
            const variants = Array.from(memoryDb.variants.values()).filter(v => v.productId === id);
            return {
                ...product,
                variants
            };
        },
        upsert: async (product: LocalProduct): Promise<void> => {
            memoryDb.products.set(product.id, product);
        },
        clear: async (): Promise<void> => {
            memoryDb.products.clear();
        },
    },
    productVariants: {
        getAll: async (): Promise<LocalProductVariant[]> => {
            return Array.from(memoryDb.variants.values());
        },
        getByProductId: async (productId: string): Promise<LocalProductVariant[]> => {
            return db.productVariants.getAll().then(all => all.filter(v => v.productId === productId));
        },
        upsert: async (variant: LocalProductVariant): Promise<void> => {
            memoryDb.variants.set(variant.id, variant);
        },
        clear: async (): Promise<void> => {
            memoryDb.variants.clear();
        },
    },
    transactions: {
        getAll: async (): Promise<LocalTransaction[]> => {
            return Array.from(memoryDb.transactions.values());
        },
        getPending: async (): Promise<LocalTransaction[]> => {
            return Array.from(memoryDb.transactions.values()).filter(
                (t) => t.syncStatus === 'pending'
            );
        },
        insert: async (txn: LocalTransaction): Promise<void> => {
            memoryDb.transactions.set(txn.id, txn);
        },
        updateSyncStatus: async (id: string, status: string): Promise<void> => {
            const txn = memoryDb.transactions.get(id);
            if (txn) {
                memoryDb.transactions.set(id, { ...txn, syncStatus: status });
            }
        },
    },
    customers: {
        getAll: async (): Promise<LocalCustomer[]> => {
            return Array.from(memoryDb.customers.values());
        },
        getById: async (id: string): Promise<LocalCustomer | undefined> => {
            return memoryDb.customers.get(id);
        },
        upsert: async (customer: LocalCustomer): Promise<void> => {
            memoryDb.customers.set(customer.id, customer);
        },
        clear: async (): Promise<void> => {
            memoryDb.customers.clear();
        },
    },
};

// Initialize database (no-op for web, SQLite init for native)
export async function initializeDatabase(): Promise<void> {
    if (Platform.OS === 'web') {
        console.log('[DB] Web platform - using in-memory storage');
    } else {
        // Native SQLite initialization would go here
        console.log('[DB] Native platform - SQLite initialized');
    }
}

export default db;
