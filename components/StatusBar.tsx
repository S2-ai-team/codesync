
import React from 'react';

interface StatusBarProps {
    line?: number | null;
    col?: number;
    status: string;
    description: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ line, col, status, description }) => {
    return (
        <footer className="bg-slate-800 text-gray-400 text-xs px-4 py-1.5 flex justify-between items-center border-t border-slate-700">
            <div className="flex items-center space-x-6">
                <span className="font-semibold text-indigo-400 w-24">{status}</span>
                <p className="flex-1 text-gray-300 truncate">{description || 'Ready for execution'}</p>
            </div>
            <div className="flex items-center space-x-4">
                <span>Ln {line || '-'}, Col {col || '-'}</span>
                <span>UTF-8</span>
            </div>
        </footer>
    );
};

export default StatusBar;
