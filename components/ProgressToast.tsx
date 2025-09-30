import React from 'react';

export const ProgressToast: React.FC<{ message: string | null }>= ({ message }) => {
    if (!message) return null;
    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="px-3 py-1.5 bg-black/70 text-white border border-white/10 rounded-full backdrop-blur-xl text-sm shadow-2xl">
                {message}
            </div>
        </div>
    );
};




