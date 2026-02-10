import midtransClient from 'midtrans-client';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Initialize Core API (for QRIS / Direct API)
export const coreApi = new midtransClient.CoreApi({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

// Initialize Snap API (for Web/Redirect) - Optional if we use Core for QRIS
export const snap = new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

/**
 * Create a Transaction (QRIS or VA) using Midtrans Core API
 * @param orderId Unique Order ID
 * @param amount Amount in IDR
 * @param paymentType 'qris' | 'bank_transfer'
 * @param bank 'bca' | 'bni' | 'bri' | 'permata' (Required for bank_transfer)
 */
export async function createTransaction(orderId: string, amount: number, paymentType: 'qris' | 'bank_transfer', bank?: string) {
    const parameter: any = {
        payment_type: paymentType,
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        }
    };

    if (paymentType === 'qris') {
        parameter.qris = {
            // acquirer: 'gopay' 
        };
    }

    if (paymentType === 'bank_transfer' && bank) {
        if (bank === 'mandiri') {
            parameter.payment_type = 'echannel';
            parameter.echannel = {
                bill_info1: "Payment For:",
                bill_info2: "Katsira Transaction"
            };
        } else {
            parameter.bank_transfer = {
                bank: bank
            };
        }
    }

    try {
        const transaction = await coreApi.charge(parameter);
        return transaction;
    } catch (error: any) {
        console.error('Midtrans Charge Error:', error.message);
        throw error;
    }
}

/**
 * Create a QRIS Transaction using Midtrans Core API
 * @deprecated Use createTransaction instead
 */
export async function createQrisTransaction(orderId: string, amount: number) {
    return createTransaction(orderId, amount, 'qris');
}

/**
 * Check Transaction Status
 */
export async function checkTransactionStatus(orderId: string) {
    try {
        const statusResponse = await coreApi.transaction.status(orderId);
        return statusResponse;
    } catch (error: any) {
        console.error('Midtrans Status Error:', error.message);
        throw error;
    }
}
