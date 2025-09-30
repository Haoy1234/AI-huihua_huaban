import React from 'react';

interface Frame { id: string; name: string }

export const FramePanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    frames?: Frame[];
    onSelect?: (id: string) => void;
    onAdd?: () => void;
    onDelete?: (id: string) => void;
    currentId?: string | null;
}> = ({ isOpen, onClose, frames = [], onSelect, onAdd, onDelete, currentId }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute top-4 right-20 z-40 w-64 bg-black/70 text-white border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Frames</div>
                <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-md hover:bg-white/10" title="Add" onClick={onAdd}>＋</button>
                    <button className="w-8 h-8 rounded-md hover:bg-white/10" onClick={onClose}>✕</button>
                </div>
            </div>
            <div className="max-h-72 overflow-auto space-y-1">
                {frames.length === 0 && <div className="text-white/60 text-sm">No frames</div>}
                {frames.map(f => (
                    <div key={f.id} className={`w-full flex items-center gap-1 px-2 py-1 rounded-md ${currentId===f.id?'bg-white/10':''}`}>
                        <button className="flex-1 text-left" onClick={() => onSelect?.(f.id)}>{f.name}</button>
                        <button title="Delete" className="w-7 h-7 rounded-md hover:bg-white/10" onClick={() => onDelete?.(f.id)}>🗑️</button>
                    </div>
                ))}
            </div>
        </div>
    );
};


