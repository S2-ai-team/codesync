
import React from 'react';

interface ExecutionVisualizerProps {
    code: string;
    activeLine: number | null;
    errorLine: number | null;
}

const ExecutionVisualizer: React.FC<ExecutionVisualizerProps> = ({ code, activeLine, errorLine }) => {
    const lines = code.split('\n');

    return (
        <div className="flex-grow bg-slate-800 rounded-b-lg font-mono text-sm p-4 overflow-auto shadow-inner h-full">
            {lines.map((line, index) => {
                const lineNumber = index + 1;
                const isError = lineNumber === errorLine;
                const isActive = lineNumber === activeLine && !isError;
                
                let lineClass = 'flex items-center transition-colors duration-200 ease-in-out px-4 rounded-md';
                if (isError) {
                    lineClass += ' bg-red-900/70 border-l-4 border-red-500';
                } else if (isActive) {
                    lineClass += ' bg-indigo-900/60';
                }

                return (
                    <div
                        key={index}
                        className={lineClass}
                        style={{ minHeight: '1.5rem' }}
                    >
                        <pre className="whitespace-pre-wrap text-gray-300">{line || ' '}</pre>
                    </div>
                );
            })}
        </div>
    );
};

export default ExecutionVisualizer;
