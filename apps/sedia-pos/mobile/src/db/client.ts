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
    customers: new Map<string, LocalCustomer>(),
    transactions: new Map<string, LocalTransaction>(),
};

// Web-compatible database interface
export const db = {
    products: {
        getAll: async (): Promise<LocalProduct[]> => {
            return Array.from(memoryDb.products.values());
        },
        getById: async (id: string): Promise<LocalProduct | undefined> => {
            return memoryDb.products.get(id);
        },
        upsert: async (product: LocalProduct): Promise<void> => {
            memoryDb.products.set(product.id, product);
        },
        clear: async (): Promise<void> => {
            memoryDb.products.clear();
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
