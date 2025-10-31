import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import ExecutionVisualizer from './components/ExecutionVisualizer';
import Controls from './components/Controls';
import StatusBar from './components/StatusBar';
import StateVisualizer from './components/StateVisualizer';
import Terminal from './components/Terminal';
import { getExecutionTrace } from './services/pythonExecutor';
import type { ExecutionStep } from './types';

type ActiveTab = 'variables' | 'terminal';
type ExecutionState = 'idle' | 'running' | 'paused' | 'finished';

const defaultCode = `# Welcome to CodeSync!
# Press 'Run' to see the visualization.

print("Let's count to 5.")
count = 0
for i in range(5):
  count = count + 1
  print(count)

name = input("What's your name? ")
print("Hello,")
print(name)
`;

const App: React.FC = () => {
    const [code, setCode] = useState<string>(defaultCode);
    const [executionTrace, setExecutionTrace] = useState<ExecutionStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [executionState, setExecutionState] = useState<ExecutionState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('variables');
    const [isAwaitingInput, setIsAwaitingInput] = useState<boolean>(false);

    const currentStep = currentStepIndex >= 0 && currentStepIndex < executionTrace.length ? executionTrace[currentStepIndex] : null;
    const prevStep = currentStepIndex > 0 ? executionTrace[currentStepIndex - 1] : null;
    const errorStep = executionTrace.find(step => step.isError);
    const activeLine = errorStep ? errorStep.lineNumber : currentStep?.lineNumber;
    const currentVariables = currentStep?.variables || null;
    const prevVariables = prevStep?.variables || null;

    const handleRun = useCallback(async () => {
        if (executionState === 'running') return;
        
        setError(null);
        setExecutionTrace([]);
        setCurrentStepIndex(-1);
        setIsAwaitingInput(false);
        setTerminalOutput([]);
        setExecutionState('running');

        try {
            const result = await getExecutionTrace(code);
            if (result.error) {
                setError(result.error);
                setExecutionTrace(result.trace || []); // Show trace up to the error
                setExecutionState('finished');
            } else if (result.trace) {
                setExecutionTrace(result.trace);
                if (result.trace.length > 0) {
                    setCurrentStepIndex(0); // Start from the first step
                } else {
                    setExecutionState('finished');
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setExecutionState('finished');
        }
    }, [code, executionState]);

    const handleTogglePlayPause = () => {
        if (executionState === 'running') {
            setExecutionState('paused');
        } else if (executionState === 'paused' || executionState === 'finished') {
            if (currentStepIndex >= executionTrace.length - 1) {
                // If at the end, run again
                handleRun();
            } else {
                setExecutionState('running');
            }
        } else if (executionState === 'idle') {
            handleRun();
        }
    };

    const handleNextStep = () => {
        if (executionTrace.length === 0) {
             handleRun().then(() => setExecutionState('paused'));
             return;
        }
        if (currentStepIndex < executionTrace.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
        setExecutionState('paused');
    };

    const handlePrevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
        setExecutionState('paused');
    };

    const handleReset = () => {
        setExecutionState('idle');
        setCurrentStepIndex(-1);
        setExecutionTrace([]);
        setError(null);
        setTerminalOutput([]);
        setCode('');
        setIsAwaitingInput(false);
    };

    const handleTerminalCommand = async (command: string) => {
        if (!isAwaitingInput || !currentStep || !currentStep.inputVariable) return;

        setTerminalOutput(prev => [...prev, `> ${command}`]);
        setIsAwaitingInput(false);

        try {
            const result = await getExecutionTrace(
                code,
                currentStep.variables,
                currentStep.lineNumber, // Start from the line *after* input
                { variable: currentStep.inputVariable, value: command }
            );
            
            if (result.error) {
                setError(result.error);
                setExecutionTrace(prev => [...prev, ...result.trace]);
                setExecutionState('finished');
            } else if (result.trace) {
                setExecutionTrace(prev => [...prev, ...result.trace]);
                setExecutionState('running'); // Resume execution
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setExecutionState('finished');
        }
    };
    
    useEffect(() => {
        if (executionState === 'running' && currentStepIndex < executionTrace.length - 1) {
            const timer = setTimeout(() => {
                const nextStep = executionTrace[currentStepIndex + 1];
                if (nextStep.isError || nextStep.requiresInput) {
                    setExecutionState('paused');
                }
                setCurrentStepIndex(prev => prev + 1);
            }, 300); // Speed up visualization
            return () => clearTimeout(timer);
        } else if (executionState === 'running' && currentStepIndex >= executionTrace.length - 1) {
             setExecutionState('finished'); // End of trace
        }
    }, [executionState, currentStepIndex, executionTrace]);

    useEffect(() => {
        setIsAwaitingInput(false); // Reset on each step
        if (currentStep) {
            if (currentStep.output) {
                setTerminalOutput(prev => [...prev, currentStep.output!]);
            }
            if (currentStep.requiresInput) {
                setIsAwaitingInput(true);
                setTerminalOutput(prev => [...prev, currentStep.description]);
                setActiveTab('terminal');
                setExecutionState('paused'); // Pause when input is needed
            }
        }
    }, [currentStep]);

    const statusText = errorStep ? 'Error' : 
        (isAwaitingInput ? 'Waiting for Input' : 
        (executionState === 'running' ? 'Running...' : 
        (executionState === 'paused' ? 'Paused' : 
        (executionState === 'finished' ? 'Finished' : 'Idle'))));

    return (
        <div className="min-h-screen bg-slate-900 text-gray-300 font-sans flex flex-col">
            <header className="bg-slate-800 p-3 shadow-lg z-10 border-b border-slate-700">
                <h1 className="text-xl font-bold text-indigo-400">CodeSync</h1>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 flex-grow p-4 gap-4 overflow-hidden">
                <div className="flex flex-col space-y-4 min-h-[50vh] md:min-h-0">
                    <Controls
                        executionState={executionState}
                        onTogglePlayPause={handleTogglePlayPause}
                        onNext={handleNextStep}
                        onPrev={handlePrevStep}
                        onReset={handleReset}
                        isAtStart={currentStepIndex <= 0}
                        isAtEnd={currentStepIndex >= executionTrace.length - 1}
                        hasTrace={executionTrace.length > 0}
                    />
                    <CodeEditor code={code} setCode={setCode} />
                </div>

                <div className="flex flex-col space-y-4 min-h-[50vh] md:min-h-0">
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-800 rounded-lg border border-slate-700 shadow-lg">
                        <div className="p-3 text-sm font-semibold text-gray-300 border-b-2 border-indigo-500">
                            Execution Visualizer
                        </div>
                        {error && <div className="p-4 bg-red-900/50 text-red-200 rounded-b-lg font-mono text-sm">{error}</div>}
                        {!error && <ExecutionVisualizer code={code} activeLine={activeLine} errorLine={errorStep?.lineNumber || null} />}
                    </div>
                    <div className="flex-1 flex flex-col bg-slate-800 rounded-lg border border-slate-700 min-h-0 shadow-lg">
                        <div className="flex border-b border-slate-700">
                            <button onClick={() => setActiveTab('variables')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'variables' ? 'bg-slate-700 text-indigo-400' : 'text-gray-400 hover:bg-slate-700/50'}`}>Variables</button>
                            <button onClick={() => setActiveTab('terminal')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'terminal' ? 'bg-slate-700 text-indigo-400' : 'text-gray-400 hover:bg-slate-700/50'}`}>Terminal</button>
                        </div>
                        <div className="flex-grow min-h-0">
                            {activeTab === 'variables' && <StateVisualizer variables={currentVariables} prevVariables={prevVariables} />}
                            {activeTab === 'terminal' && <Terminal output={terminalOutput} onCommand={handleTerminalCommand} isAwaitingInput={isAwaitingInput} />}
                        </div>
                    </div>
                </div>
            </main>

            <StatusBar
                line={activeLine}
                col={1}
                status={statusText}
                description={currentStep?.description || 'Ready. Write your code and press Run.'}
            />
        </div>
    );
};

export default App;