'use client';

import Link, { LinkProps } from 'next/link';
import { useState, useEffect } from 'react';

interface OfflineLinkProps extends React.PropsWithChildren<LinkProps> {
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function OfflineLink({ href, children, className, onClick, ...props }: OfflineLinkProps) {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Initialize state purely on the client
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOffline(!navigator.onLine);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    // If offline, bypass Next.js App Router client-side navigation (which relies on RSC payloads)
    // and force a standard hard navigation to trigger the Service Worker's HTML cache rule.
    if (isOffline) {
        return (
            <a
                href={href.toString()}
                className={className}
                onClick={onClick}
            >
                {children}
            </a>
        );
    }

    // If online, use standard Next.js fast SPA navigation
    return (
        <Link href={href} className={className} onClick={onClick} {...props}>
            {children}
        </Link>
    );
}
