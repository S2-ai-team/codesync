import React from 'react';

interface StateVisualizerProps {
    variables: Record<string, any> | null;
    prevVariables: Record<string, any> | null;
}

const StateVisualizer: React.FC<StateVisualizerProps> = ({ variables, prevVariables }) => {
    const hasVariables = variables && Object.keys(variables).length > 0;

    const hasChanged = (key: string, value: any) => {
        // Highlight if it's the very first variable state
        if (!prevVariables) return true;
        // Highlight if the key is new or the value is different
        return !(key in prevVariables) || JSON.stringify(prevVariables[key]) !== JSON.stringify(value);
    };

    return (
        <div className="flex-grow bg-slate-800 font-mono text-sm p-4 overflow-auto h-full">
            <h3 className="text-gray-400 font-semibold mb-3 border-b border-slate-700 pb-2">Variables</h3>
            {hasVariables ? (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-600">
                            <th className="py-1 px-2 text-indigo-400">Name</th>
                            <th className="py-1 px-2 text-indigo-400">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(variables!).map(([key, value]) => (
                            <tr 
                                key={key} 
                                className={`border-b border-slate-700/50 ${hasChanged(key, value) ? 'animate-highlight' : ''}`}
                            >
                                <td className="py-1 px-2 text-gray-300">{key}</td>
                                <td className="py-1 px-2 text-green-400 whitespace-pre-wrap">{JSON.stringify(value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-gray-500 italic mt-2">No variables in the current scope.</p>
            )}
        </div>
    );
};

export default StateVisualizer;