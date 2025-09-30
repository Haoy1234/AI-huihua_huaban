import React from 'react';

export const TopLeftAppButton: React.FC<{ onBoards: () => void }> = ({ onBoards }) => (
    <button
        className="absolute top-4 left-4 z-40 w-9 h-9 rounded-full bg-black/30 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10"
        title="Boards"
        onClick={onBoards}
    >
        ▦
    </button>
);




