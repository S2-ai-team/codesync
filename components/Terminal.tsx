import React, { useState, useEffect, useRef } from 'react';

interface TerminalProps {
    output: string[];
    onCommand: (command: string) => void;
    isAwaitingInput: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ output, onCommand, isAwaitingInput }) => {
    const [input, setInput] = useState('');
    const endOfOutputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        endOfOutputRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [output]);
    
    useEffect(() => {
        if(isAwaitingInput) {
            inputRef.current?.focus();
        }
    }, [isAwaitingInput])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim() !== '' && isAwaitingInput) {
                onCommand(input);
                setInput('');
            }
        }
    };

    return (
        <div className="flex flex-col bg-slate-900 font-mono text-sm text-gray-300 h-full p-4">
            <div className="flex-grow overflow-y-auto pr-2">
                {output.map((line, index) => {
                    const isUserInput = line.startsWith('> ');
                    return (
                        <div key={index} className="whitespace-pre-wrap break-words">
                        {isUserInput ? <span className="text-cyan-400">{line}</span> : line}
                        </div>
                    );
                })}
                <div ref={endOfOutputRef} />
            </div>
            {isAwaitingInput && (
                <div className="flex items-center mt-2 border-t border-slate-700 pt-2">
                    <span className="text-indigo-400 mr-2">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow bg-transparent focus:outline-none disabled:bg-slate-800"
                        placeholder="Enter input..."
                        aria-label="Terminal command input"
                        disabled={!isAwaitingInput}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
};

export default Terminal;