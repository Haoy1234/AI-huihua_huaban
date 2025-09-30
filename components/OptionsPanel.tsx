import React from 'react';
import type { ImageAspectRatio } from '../services/geminiAdvancedService';
import type { VideoAspectRatio } from '../services/videoService';

export interface OptionsPanelProps {
    mode: 'image' | 'video';
    numberOfImages: number;
    setNumberOfImages: (n: number) => void;
    imageAspectRatio: ImageAspectRatio;
    setImageAspectRatio: (r: ImageAspectRatio) => void;
    numberOfVideos: number;
    setNumberOfVideos: (n: number) => void;
    videoAspectRatio: VideoAspectRatio;
    setVideoAspectRatio: (r: VideoAspectRatio) => void;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = (p) => {
    const isImage = p.mode === 'image';
    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 bg-neutral-800/90 border border-white/10 rounded-lg shadow-2xl text-white flex gap-4">
            {isImage ? (
                <>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs opacity-70">Count</div>
                        {[1,2,3,4].map(n => (
                            <button key={n} className={`w-10 h-10 rounded-md ${p.numberOfImages===n?'bg-blue-500':'hover:bg-white/10'}`} onClick={() => p.setNumberOfImages(n)}>{n}</button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs opacity-70">Aspect</div>
                        {(['1:1','16:9','9:16','4:3','3:4'] as ImageAspectRatio[]).map(r => (
                            <button key={r} className={`px-3 h-10 rounded-md ${p.imageAspectRatio===r?'bg-blue-500':'hover:bg-white/10'}`} onClick={() => p.setImageAspectRatio(r)}>{r}</button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs opacity-70">Videos</div>
                        {[1,2].map(n => (
                            <button key={n} className={`w-10 h-10 rounded-md ${p.numberOfVideos===n?'bg-purple-500':'hover:bg-white/10'}`} onClick={() => p.setNumberOfVideos(n)}>{n}</button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs opacity-70">Aspect</div>
                        {(['16:9','9:16'] as VideoAspectRatio[]).map(r => (
                            <button key={r} className={`px-3 h-10 rounded-md ${p.videoAspectRatio===r?'bg-purple-500':'hover:bg-white/10'}`} onClick={() => p.setVideoAspectRatio(r)}>{r}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};




