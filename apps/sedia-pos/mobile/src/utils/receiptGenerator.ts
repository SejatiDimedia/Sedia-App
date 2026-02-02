export const generateReceiptHtml = (transaction: any, outlet: any) => {
    const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    const formattedDate = date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #333; margin: 0; padding: 0; }
            .container { padding: 20px; max-width: 100%; margin: 0 auto; box-sizing: border-box; }
            .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .footer { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 12px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .totals { margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            h1 { font-size: 20px; margin: 5px 0; font-weight: bold; }
            p { margin: 2px 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="header">
                <h1>${outlet?.name || 'Sedia POS'}</h1>
                <p>${outlet?.address || ''}</p>
                <p>${outlet?.phone || ''}</p>
                <br/>
                <div class="row">
                     <span>${formattedDate}</span>
                </div>
                <div class="row">
                     <span>No: ${transaction.invoiceNumber}</span>
                </div>
            </div>
            
            <div class="items">
                ${transaction.items.map((item: any) => `
                    <div class="item">
                        <span class="text-left" style="flex: 2;">${item.productName || item.name} <br/> <small>x${item.quantity}</small></span>
                        <span class="text-right" style="flex: 1;">${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="totals">
                <div class="row">
                    <span>Subtotal</span>
                    <span>Rp ${transaction.subtotal.toLocaleString('id-ID')}</span>
                </div>
                ${transaction.taxDetails ? `
                <div class="row">
                    <span>${transaction.taxDetails.name} (${transaction.taxDetails.rate}%)</span>
                    <span>Rp ${transaction.tax.toLocaleString('id-ID')}</span>
                </div>
                ` : ''}
                <div class="row bold" style="font-size: 16px; margin-top: 5px;">
                    <span>Total</span>
                    <span>Rp ${transaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div class="row">
                    <span>Bayar (${transaction.paymentMethod})</span>
                    <span>Rp ${transaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>Terima Kasih</p>
                <p>Powered by SediaPOS</p>
            </div>
        </div>
      </body>
    </html>
  `;
};
