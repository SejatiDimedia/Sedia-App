'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Pixels per second for each speed level
const SPEED_MAP: Record<number, number> = {
    1: 20,
    2: 40,
    3: 70,
    4: 110,
    5: 160,
};

/**
 * Custom hook for smooth auto-scrolling with adjustable speed.
 * Uses requestAnimationFrame for buttery-smooth 60fps scrolling.
 */
export function useAutoScroll() {
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(2);

    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const speedRef = useRef(scrollSpeed);
    const isScrollingRef = useRef(isAutoScrolling);

    // Keep refs in sync with state
    useEffect(() => {
        speedRef.current = scrollSpeed;
    }, [scrollSpeed]);

    useEffect(() => {
        isScrollingRef.current = isAutoScrolling;
    }, [isAutoScrolling]);

    // The core scroll loop — reads from refs to avoid re-creating the callback
    const scrollLoop = useCallback((time: number) => {
        if (!isScrollingRef.current) return;

        if (lastTimeRef.current !== null) {
            const delta = (time - lastTimeRef.current) / 1000;
            const px = (SPEED_MAP[speedRef.current] ?? 40) * delta;
            window.scrollBy(0, px);
        }

        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(scrollLoop);
    }, []);

    // Start / stop the animation loop when `isAutoScrolling` changes
    useEffect(() => {
        if (isAutoScrolling) {
            lastTimeRef.current = null;
            requestRef.current = requestAnimationFrame(scrollLoop);
        } else {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        }

        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, [isAutoScrolling, scrollLoop]);

    const toggleAutoScroll = useCallback(() => {
        setIsAutoScrolling(prev => !prev);
    }, []);

    const stopAutoScroll = useCallback(() => {
        setIsAutoScrolling(false);
    }, []);

    return {
        isAutoScrolling,
        scrollSpeed,
        setScrollSpeed,
        toggleAutoScroll,
        stopAutoScroll,
    };
}
