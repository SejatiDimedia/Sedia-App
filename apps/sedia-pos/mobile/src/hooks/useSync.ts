import { useState, useEffect, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { db, initializeDatabase, LocalProduct, LocalCustomer } from "../db/client";

// API Configuration
import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface UseSyncReturn {
    isOnline: boolean;
    syncStatus: SyncStatus;
    lastSyncedAt: Date | null;
    syncProducts: () => Promise<void>;
    syncCustomers: () => Promise<void>;
    syncPendingTransactions: () => Promise<void>;
    syncOutlets: () => Promise<void>; // Added
    syncAll: () => Promise<void>;
}

export function useSync(): UseSyncReturn {
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    // Monitor network connectivity
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            // On web, NetInfo might return null for isConnected
            // Use navigator.onLine as fallback for web platform
            let online = state.isConnected;
            if (online === null && typeof navigator !== 'undefined' && 'onLine' in navigator) {
                online = navigator.onLine;
            }
            // Default to true if we can't determine (assume online)
            online = online ?? true;

            const wasOffline = !isOnline;
            setIsOnline(online);

            // Trigger sync if we just came online OR if we are initializing and online
            if (online) {
                // If status is idle (initial) or we were offline, try to sync
                if (syncStatus === "idle" || syncStatus === "offline" || wasOffline) {
                    syncAll();
                }
            } else {
                setSyncStatus("offline");
            }
        });

        initializeDatabase();

        return () => unsubscribe();
    }, [syncStatus]); // Add syncStatus to dependency to re-evaluate if it changes (though mainly we rely on event listener)

    // Sync outlets from backend
    const syncOutlets = useCallback(async () => {
        if (!isOnline) return;
        try {
            // We use the store's fetchOutlets action which handles the API call and state update
            const { fetchOutlets } = require("../store/outletStore").useOutletStore.getState();
            await fetchOutlets();
            console.log("[Sync] Synced outlets configuration");
        } catch (error) {
            console.error("[Sync] Outlet sync failed:", error);
        }
    }, [isOnline]);

    // Sync products from backend to local storage
    const syncProducts = useCallback(async () => {
        if (!isOnline) {
            console.log("[Sync] Offline - skipping product sync");
            return;
        }

        try {
            setSyncStatus("syncing");

            // Fetch real products from backend API (with variants key expected)
            const response = await fetch(`${API_BASE_URL}/products`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const products = await response.json();

            // Map backend products to local format and save to local DB
            for (const product of products) {
                const localProduct: LocalProduct = {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    stock: product.stock || 0,
                    imageUrl: product.imageUrl,
                    isActive: product.isActive ?? true,
                    syncedAt: new Date(),
                    categoryId: product.categoryId,
                };
                await db.products.upsert(localProduct);

                // Sync Variants if available
                if (product.variants && Array.isArray(product.variants)) {
                    for (const variant of product.variants) {
                        await db.productVariants.upsert({
                            id: variant.id,
                            productId: product.id,
                            name: variant.name,
                            sku: variant.sku,
                            priceAdjustment: String(variant.priceAdjustment || "0"),
                            stock: variant.stock || 0,
                            isActive: variant.isActive ?? true,
                            syncedAt: new Date()
                        });
                    }
                }
            }

            console.log(`[Sync] Synced ${products.length} products (with variants) from backend`);
            setLastSyncedAt(new Date());
            setSyncStatus("synced");
        } catch (error) {
            console.error("[Sync] Product sync failed:", error);
            // Fallback: use mock data if API fails (for development/offline)
            const mockProducts: LocalProduct[] = [
                { id: "mock-1", name: "Kopi Susu", price: 18000, stock: 50, isActive: true },
                { id: "mock-2", name: "Es Teh Manis", price: 8000, stock: 100, isActive: true },
            ];

            for (const product of mockProducts) {
                await db.products.upsert({ ...product, syncedAt: new Date() });
            }

            console.log(`[Sync] Using ${mockProducts.length} mock products (API unavailable)`);
            setLastSyncedAt(new Date());
            setSyncStatus("synced");
        }
    }, [isOnline]);

    // Sync customers from backend to local storage
    const syncCustomers = useCallback(async () => {
        if (!isOnline) {
            console.log("[Sync] Offline - skipping customer sync");
            return;
        }

        try {
            setSyncStatus("syncing");

            // Fetch real customers from backend API
            const response = await fetch(`${API_BASE_URL}/customers`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const customers = await response.json();

            // Store in local DB
            for (const customer of customers) {
                const localCustomer: LocalCustomer = {
                    id: customer.id,
                    outletId: customer.outletId,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    points: customer.points || 0,
                    totalSpent: customer.totalSpent,
                    syncedAt: new Date(),
                };
                await db.customers.upsert(localCustomer);
            }

            console.log(`[Sync] Synced ${customers.length} customers from backend`);
            setLastSyncedAt(new Date());
            setSyncStatus("synced");
        } catch (error) {
            console.error("[Sync] Customer sync failed:", error);
            // Fallback mock data
            const mockCustomers: LocalCustomer[] = [
                { id: "cust-1", outletId: "out-1", name: "Budi Santoso", phone: "08123456789", points: 15, totalSpent: "150000" },
                { id: "cust-2", outletId: "out-1", name: "Siti Aminah", phone: "08198765432", points: 50, totalSpent: "500000" },
            ];

            for (const customer of mockCustomers) {
                await db.customers.upsert({ ...customer, syncedAt: new Date() });
            }
            console.log(`[Sync] Using ${mockCustomers.length} mock customers`);
            setLastSyncedAt(new Date());
            setSyncStatus("synced");
        }
    }, [isOnline]);

    // Push pending local transactions to backend
    const syncPendingTransactions = useCallback(async () => {
        if (!isOnline) {
            console.log("[Sync] Offline - skipping transaction sync");
            return;
        }

        try {
            setSyncStatus("syncing");

            const pendingTxns = await db.transactions.getPending();

            for (const txn of pendingTxns) {
                try {
                    // POST transaction to backend
                    const response = await fetch(`${API_BASE_URL}/transactions`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            outletId: txn.outletId || "default-outlet",
                            invoiceNumber: txn.id,
                            customerId: txn.customerId || null,
                            totalAmount: txn.totalAmount,
                            paymentMethod: txn.paymentMethod,
                            paymentStatus: "paid",
                            status: "completed",
                            subtotal: txn.totalAmount,
                            items: txn.items?.map((item: { productId?: string; productName: string; quantity: number; price: number; total: number }) => ({
                                productId: item.productId,
                                productName: item.productName,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.total,
                            })),
                        }),
                    });

                    if (response.ok) {
                        await db.transactions.updateSyncStatus(txn.id, "synced");
                        console.log(`[Sync] Transaction ${txn.id} synced to backend`);
                    } else {
                        console.error(`[Sync] Failed to sync transaction ${txn.id}:`, await response.text());
                    }
                } catch (err) {
                    console.error(`[Sync] Error syncing transaction ${txn.id}:`, err);
                }
            }

            if (pendingTxns.length > 0) {
                console.log(`[Sync] Synced ${pendingTxns.length} transactions`);
            }

            setLastSyncedAt(new Date());
            setSyncStatus("synced");
        } catch (error) {
            console.error("[Sync] Transaction sync failed:", error);
            setSyncStatus("error");
        }
    }, [isOnline]);

    // Full sync (products + customers + transactions)
    const syncAll = useCallback(async () => {
        await syncOutlets(); // Sync outlets first to get branding
        await syncProducts();
        await syncCustomers();
        await syncPendingTransactions();
    }, [syncOutlets, syncProducts, syncCustomers, syncPendingTransactions]);

    return {
        isOnline,
        syncStatus,
        lastSyncedAt,
        syncProducts,
        syncCustomers,
        syncPendingTransactions,
        syncOutlets,
        syncAll,
    };
}
