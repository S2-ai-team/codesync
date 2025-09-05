import React, { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode }) => {
    const [lineCount, setLineCount] = useState(code.split('\n').length);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setLineCount(code.split('\n').length || 1);
    }, [code]);

    const handleScroll = () => {
        if (lineNumbersRef.current && textAreaRef.current) {
            lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const { selectionStart, selectionEnd } = e.currentTarget;
            
            const newCode = 
                code.substring(0, selectionStart) + 
                '  ' + 
                code.substring(selectionEnd);

            setCode(newCode);

            // Move cursor after inserted spaces
            setTimeout(() => {
                if(textAreaRef.current) {
                    textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = selectionStart + 2;
                }
            }, 0);
        }
    };


    return (
        <div className="flex-grow flex bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 h-full">
            <div
                ref={lineNumbersRef}
                className="p-4 bg-slate-900/50 text-right text-gray-500 font-mono text-sm select-none overflow-y-hidden"
                style={{ lineHeight: '1.5rem' }}
            >
                {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                ))}
            </div>
            <textarea
                ref={textAreaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="flex-grow p-4 bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none"
                style={{ lineHeight: '1.5rem' }}
                spellCheck="false"
                wrap="off"
                placeholder="Enter your Python code here..."
            />
        </div>
    );
};

export default CodeEditor;