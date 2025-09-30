import React from 'react';

interface Props {
    onPlay: () => void;
    onLayers: () => void;
    onFrames: () => void;
    onSettings: () => void;
}

export const TopRightControls: React.FC<Props> = ({ onPlay, onLayers, onFrames, onSettings }) => {
    return (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1">
            <button title="Play" onClick={onPlay} className="w-9 h-9 rounded-full hover:bg-white/10 text-white">▶</button>
            <button title="Layers" onClick={onLayers} className="w-9 h-9 rounded-full hover:bg-white/10 text-white">🧱</button>
            <button title="Frames" onClick={onFrames} className="w-9 h-9 rounded-full hover:bg-white/10 text-white">＃</button>
            <button title="Settings" onClick={onSettings} className="w-9 h-9 rounded-full hover:bg-white/10 text-white">⚙️</button>
        </div>
    );
};




