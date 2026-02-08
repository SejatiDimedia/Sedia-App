export const generateReceiptHtml = (transaction: any, outlet: any) => {
    const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    const formattedDate = date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPaymentMethod = (method: string) => {
        if (!method) return "-";
        const m = method.toLowerCase();
        if (m === "cash") return "Tunai";
        if (m === "qris" || m === "midtrans_qris") return "QRIS";
        if (m.startsWith("midtrans_va_")) return `Transfer ${m.replace("midtrans_va_", "").toUpperCase()}`;
        if (m === "transfer") return "Transfer";
        return method;
    };

    // Calculate points (mock logic if not present in transaction)
    const pointsEarned = transaction.pointsEarned || 0;

    return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
            body { 
                font-family: 'Courier New', Courier, monospace; 
                text-align: center; 
                color: #000; 
                margin: 0; 
                padding: 10px; 
                background: #fff;
                font-size: 11px;
                line-height: 1.2;
            }
            .container {
                max-width: 100%;
                margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .header h1 { font-size: 16px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 2px 0 0 0; font-size: 10px; color: #555; }
            .divider {
                border-bottom: 1px dashed #000;
                margin: 8px 0;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
            }
            .items {
                margin-bottom: 5px;
            }
            .item {
                margin-bottom: 6px;
            }
            .item-name {
                font-weight: bold;
                text-align: left;
                margin-bottom: 2px;
            }
            .item-variant {
                font-weight: normal;
                font-size: 10px;
            }
            .item-details {
                display: flex;
                justify-content: space-between;
                padding-left: 10px;
            }
            .totals {
                margin-top: 5px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
            }
            .grand-total {
                font-weight: bold;
                font-size: 14px;
                margin-top: 5px;
                margin-bottom: 5px;
            }
            .payment-details {
                margin-top: 5px;
                padding-top: 5px;
                border-top: 1px dashed #000;
            }
            .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 10px;
            }
            .bold { font-weight: bold; }
            .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="receipt">
            <div class="header">
                <h1>${outlet?.name || 'Sedia POS'}</h1>
                ${outlet?.address ? `<p>${outlet.address}</p>` : ''}
                ${outlet?.phone ? `<p>Tel: ${outlet.phone}</p>` : ''}
            </div>

            <div class="divider"></div>

            <!-- Transaction Info -->
            <div class="info-row">
                <span>No. Invoice</span>
                <span class="bold">${transaction.invoiceNumber}</span>
            </div>
            <div class="info-row">
                <span>Tanggal</span>
                <span>${formattedDate}</span>
            </div>
            ${transaction.cashierName ? `
            <div class="info-row">
                <span>Kasir</span>
                <span>${transaction.cashierName}</span>
            </div>` : ''}
            ${transaction.customerName ? `
            <div class="info-row">
                <span>Pelanggan</span>
                <span class="bold">${transaction.customerName}</span>
            </div>` : ''}

            <div class="divider"></div>

            <!-- Items -->
            <div class="items">
                ${transaction.items.map((item: any) => `
                    <div class="item">
                        <div class="item-name">
                            ${item.productName || item.name}
                            ${item.variantName ? `<span class="item-variant">(${item.variantName})</span>` : ''}
                        </div>
                        <div class="item-details">
                            <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                            <span>${formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="divider"></div>

            <!-- Totals -->
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(transaction.subtotal)}</span>
                </div>
                
                ${transaction.discount > 0 ? `
                <div class="total-row">
                    <span>Diskon</span>
                    <span>-${formatCurrency(transaction.discount)}</span>
                </div>` : ''}

                ${transaction.taxDetails ? `
                <div class="total-row">
                    <span>${transaction.taxDetails.name} (${transaction.taxDetails.rate}%)</span>
                    <span>${formatCurrency(transaction.tax)}</span>
                </div>` : ''}

                <div class="total-row grand-total">
                    <span>TOTAL</span>
                    <span>${formatCurrency(transaction.totalAmount)}</span>
                </div>

                <!-- Payment Details -->
                <div class="payment-details">
                    ${transaction.payments && transaction.payments.length > 0 ?
            transaction.payments.map((p: any) => `
                            <div class="total-row" style="font-size: 10px;">
                                <span style="text-transform: uppercase;">BAYAR (${formatPaymentMethod(p.paymentMethod)})</span>
                                <span>${formatCurrency(p.amount)}</span>
                            </div>
                        `).join('')
            : `
                        <div class="total-row">
                            <span style="text-transform: uppercase;">BAYAR (${formatPaymentMethod(transaction.paymentMethod)})</span>
                            <span>${formatCurrency(transaction.totalAmount)}</span>
                        </div>
                        `
        }
                </div>
            </div>

            ${pointsEarned > 0 ? `
            <div class="divider"></div>
            <div class="center bold">
                Poin Diterima: ${pointsEarned}
            </div>
            ` : ''}

            <div class="divider"></div>

            <!-- Footer -->
            <div class="footer">
                <div class="bold">Terima Kasih</div>
                <div style="margin-top: 4px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
                <div style="margin-top: 8px; opacity: 0.6; font-size: 9px;">Powered by SediaPOS</div>
            </div>
        </div>
      </body>
    </html>
  `;
};
