import React from 'react';
import { PlayIcon, PauseIcon, ResetIcon, NextIcon, PrevIcon } from './icons';

interface ControlsProps {
    executionState: 'idle' | 'running' | 'paused' | 'finished';
    onTogglePlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    isAtStart: boolean;
    isAtEnd: boolean;
    hasTrace: boolean;
}

const Controls: React.FC<ControlsProps> = ({ executionState, onTogglePlayPause, onNext, onPrev, onReset, isAtStart, isAtEnd, hasTrace }) => {
    const isRunning = executionState === 'running';
    
    const playPauseText = isRunning ? 'Pause' : (executionState === 'finished' && isAtEnd ? 'Rerun' : 'Run');
    const playPauseIcon = isRunning ? <PauseIcon /> : <PlayIcon />;

    return (
        <div className="flex items-center space-x-2 p-2 bg-slate-800 rounded-lg shadow-md border border-slate-700">
             <button
                onClick={onReset}
                className="flex items-center justify-center px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Reset application"
            >
                <ResetIcon />
            </button>
             <button
                onClick={onPrev}
                disabled={!hasTrace || isAtStart}
                className="flex items-center justify-center px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Previous step"
            >
                <PrevIcon />
            </button>
            <button
                onClick={onTogglePlayPause}
                className="flex-grow flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={playPauseText}
            >
                {playPauseIcon}
                <span className="ml-2 font-semibold">{playPauseText}</span>
            </button>
             <button
                onClick={onNext}
                disabled={hasTrace && isAtEnd}
                className="flex items-center justify-center px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Next step"
            >
                <NextIcon />
            </button>
        </div>
    );
};

export default Controls;