import React from 'react';
import type { ImageAspectRatio } from '../services/geminiAdvancedService';
import type { VideoAspectRatio, ImageInput } from '../services/videoService';
import { OptionsPanel } from './OptionsPanel';

interface Props {
    t: (k: string, ...args: any[]) => string;
    prompt: string;
    setPrompt: (v: string) => void;
    isLoading: boolean;

    imageAspectRatio: ImageAspectRatio;
    setImageAspectRatio: (r: ImageAspectRatio) => void;
    numberOfImages: number;
    setNumberOfImages: (n: number) => void;

    videoAspectRatio: VideoAspectRatio;
    setVideoAspectRatio: (r: VideoAspectRatio) => void;
    numberOfVideos: number;
    setNumberOfVideos: (n: number) => void;

    onAdvancedGenerateImage: () => void;
    onAdvancedGenerateVideo: (selectedImage?: ImageInput) => void;
}

export const AdvancedPromptBar: React.FC<Props> = (p) => {
    const [openPanel, setOpenPanel] = React.useState(false);

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
            <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 p-2 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl text-white"
                     style={{ backgroundColor: `var(--ui-bg-color)` }}>
                    <button onClick={() => setOpenPanel(v => !v)} className="w-10 h-10 rounded-full bg-black/20 hover:bg-white/10">⚙️</button>

                    <button onClick={p.onAdvancedGenerateImage}
                            disabled={p.isLoading || !p.prompt.trim()}
                            className="px-3 h-10 rounded-full bg-blue-600 hover:brightness-110 disabled:opacity-50">
                        {p.t('promptBar.generate')} × {p.numberOfImages}
                    </button>

                    <div className="w-px h-8 bg-white/20" />

                    <button onClick={() => p.onAdvancedGenerateVideo()}
                            disabled={p.isLoading || !p.prompt.trim()}
                            className="px-3 h-10 rounded-full bg-purple-600 hover:brightness-110 disabled:opacity-50">
                        {p.t('promptBar.generate')} 🎥
                    </button>
                </div>
                {openPanel && (
                    <OptionsPanel
                        mode={'image'}
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
        </div>
    );
};


