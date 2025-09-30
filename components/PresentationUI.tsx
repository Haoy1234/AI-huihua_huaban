import React from 'react';

export const PresentationUI: React.FC<{
    isActive: boolean;
    onPrev: () => void;
    onNext: () => void;
    onExit: () => void;
}> = ({ isActive, onPrev, onNext, onExit }) => {
    if (!isActive) return null;
    return (
        <div className="absolute inset-0 z-50 pointer-events-none">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 text-white border border-white/10 rounded-full px-2 py-1 pointer-events-auto">
                <button onClick={onPrev} className="w-9 h-9 rounded-full hover:bg-white/10">←</button>
                <button onClick={onNext} className="w-9 h-9 rounded-full hover:bg-white/10">→</button>
                <button onClick={onExit} className="w-9 h-9 rounded-full hover:bg-white/10">✕</button>
            </div>
        </div>
    );
};




