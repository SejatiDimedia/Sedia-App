'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface AyahAudioPlayerProps {
    audioUrl: string;
}

export default function AyahAudioPlayer({ audioUrl }: AyahAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => {
            setIsLoading(false);
            setIsPlaying(true);
        };
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                // Pause all other audio elements first
                document.querySelectorAll('audio').forEach(el => {
                    if (el !== audioRef.current) el.pause();
                });
                audioRef.current.play();
            }
        }
    };

    return (
        <div className="flex items-center">
            <audio ref={audioRef} src={audioUrl} preload="none" />
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isPlaying
                        ? 'bg-primary text-white shadow-md'
                        : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                    }`}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
            </button>
        </div>
    );
}
