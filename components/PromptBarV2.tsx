import React from 'react';
import type { ImageAspectRatio } from '../services/geminiAdvancedService';
import type { VideoAspectRatio } from '../services/videoService';
import { OptionsPanel } from './OptionsPanel';

interface Props {
    t: (k: string, ...args: any[]) => string;
    prompt: string; setPrompt: (v: string) => void; isLoading: boolean; onGenerate: () => void;
    mode: 'image' | 'video'; setMode: (m: 'image' | 'video') => void;
    numberOfImages: number; setNumberOfImages: (n: number) => void;
    imageAspectRatio: ImageAspectRatio; setImageAspectRatio: (r: ImageAspectRatio) => void;
    numberOfVideos: number; setNumberOfVideos: (n: number) => void;
    videoAspectRatio: VideoAspectRatio; setVideoAspectRatio: (r: VideoAspectRatio) => void;
    onOpenInspiration: () => void;
}

export const PromptBarV2: React.FC<Props> = (p) => {
    const [openPanel, setOpenPanel] = React.useState(false);
    const isImage = p.mode === 'image';

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
            <div className="flex items-center gap-2 p-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                <button
                    title="打开灵感库"
                    onClick={p.onOpenInspiration}
                    className="w-10 h-10 rounded-full bg-black/20 hover:bg-white/10 text-white"
                >
                    💡
                </button>
                <button
                    title={isImage ? p.t('promptBar.switchToVideo') : p.t('promptBar.switchToImage')}
                    onClick={() => p.setMode(isImage ? 'video' : 'image')}
                    className="w-10 h-10 rounded-full bg-black/20 hover:bg-white/10 text-white"
                >
                    {isImage ? '🖼️' : '🎬'}
                </button>
                <input
                    value={p.prompt}
                    onChange={(e) => p.setPrompt(e.target.value)}
                    placeholder={isImage ? 'Describe an image to generate from scratch...' : 'Describe a video to generate from scratch...'}
                    className="flex-1 bg-transparent text-white placeholder-white/50 outline-none px-2"
                />
                <button
                    title="Options"
                    onClick={() => setOpenPanel(v => !v)}
                    className="w-10 h-10 rounded-full bg-black/20 hover:bg-white/10 text-white"
                >
                    ⚙️
                </button>
                <button
                    disabled={p.isLoading || !p.prompt.trim()}
                    onClick={p.onGenerate}
                    title={isImage ? 'Generate image' : 'Generate video'}
                    className={`px-3 h-10 rounded-full text-white hover:brightness-110 disabled:opacity-50 ${isImage ? 'bg-blue-600' : 'bg-purple-600'}`}
                >
                    {isImage ? 'Generate' : 'Generate 🎥'}
                </button>
            </div>
            {openPanel && (
                <OptionsPanel
                    mode={p.mode}
                    numberOfImages={p.numberOfImages}
                    setNumberOfImages={p.setNumberOfImages}
                    imageAspectRatio={p.imageAspectRatio}
                    setImageAspectRatio={p.setImageAspectRatio}
                    numberOfVideos={p.numberOfVideos}
                    setNumberOfVideos={p.setNumberOfVideos}
                    videoAspectRatio={p.videoAspectRatio}
                    setVideoAspectRatio={p.setVideoAspectRatio}
                />
            )}
        </div>
    );
};


