export interface StoreStatus {
    isOpen: boolean;
    nextStatusChange?: string;
}

export function getStoreStatus(openTime: string | null | undefined, closeTime: string | null | undefined): StoreStatus {
    if (!openTime || !closeTime) {
        return { isOpen: true }; // Assume always open if no hours set
    }

    // Get current time in local timezone (WIB/GMT+7 as per user context)
    // For simplicity, we use the local time from the environment
    const now = new Date();
    const currentTimeString = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta' // Indonesia/Jakarta timezone
    });

    const [currentH, currentM] = currentTimeString.split(':').map(Number);
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const currentTimeValue = currentH * 60 + currentM;
    const openTimeValue = openH * 60 + openM;
    const closeTimeValue = closeH * 60 + closeM;

    let isOpen = false;

    if (closeTimeValue > openTimeValue) {
        // Normal case: 08:00 - 22:00
        isOpen = currentTimeValue >= openTimeValue && currentTimeValue < closeTimeValue;
    } else {
        // Overnight case: 22:00 - 04:00
        isOpen = currentTimeValue >= openTimeValue || currentTimeValue < closeTimeValue;
    }

    return { isOpen };
}
