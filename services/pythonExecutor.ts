import type { ExecutorResponse, ExecutionStep } from '../types';

/**
 * A simple, offline Python execution simulator.
 * Parses code line-by-line to create a visualizable execution trace.
 * Supports:
 * - Variable assignment (numbers, strings)
 * - Basic arithmetic (+, -, *, /) with correct operator precedence
 * - print() and input() statements
 * - for i in range(n) loops
 * - Basic error handling (NameError, ZeroDivisionError, SyntaxError)
 */

// Recursive descent parser for simple arithmetic expressions.
// Handles operator precedence for +, -, *, /. Does not handle parentheses.
const evaluateExpression = (expr: string, scope: Record<string, any>): any => {
    expr = expr.trim();

    // Terminals (base cases for recursion)
    const parseFactor = (): any => {
        expr = expr.trim();
        // String literal
        if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
            return expr.slice(1, -1);
        }

        // Number literal
        if (!isNaN(Number(expr))) {
            return Number(expr);
        }

        // Variable
        if (scope[expr] !== undefined) {
            return scope[expr];
        }
        
        // input() function call
        const inputMatch = expr.match(/^input\((.*)\)$/);
        if (inputMatch) {
          const promptExpr = inputMatch[1].trim();
          if(promptExpr) return evaluateExpression(promptExpr, scope);
          return '';
        }
        throw new Error(`NameError: name '${expr}' is not defined`);
    };

    // Find the last occurrence of an operator at the lowest precedence level
    let inString = false;
    // Level 1: Addition and Subtraction (lowest precedence)
    for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];
        if (char === '"' || char === "'") inString = !inString;
        if (!inString && (char === '+' || char === '-')) {
            const left = evaluateExpression(expr.substring(0, i), scope);
            const right = evaluateExpression(expr.substring(i + 1), scope);
            if (typeof left !== 'number' || typeof right !== 'number') {
                 throw new Error(`TypeError: unsupported operand type(s) for ${char}`);
            }
            return char === '+' ? left + right : left - right;
        }
    }
    inString = false;
    // Level 2: Multiplication and Division
    for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];
        if (char === '"' || char === "'") inString = !inString;
        if (!inString && (char === '*' || char === '/')) {
            const left = evaluateExpression(expr.substring(0, i), scope);
            const right = evaluateExpression(expr.substring(i + 1), scope);
             if (typeof left !== 'number' || typeof right !== 'number') {
                 throw new Error(`TypeError: unsupported operand type(s) for ${char}`);
            }
            if (char === '/') {
                if (right === 0) throw new Error('ZeroDivisionError: division by zero');
                return left / right;
            }
            return left * right;
        }
    }
    
    // If no operators found, it must be a single factor
    return parseFactor();
};


export const getExecutionTrace = async (
  code: string, 
  initialScope: Record<string, any> = {},
  startLine: number = 0,
  providedInput: { variable: string; value: string } | null = null
): Promise<ExecutorResponse> => {
    const trace: ExecutionStep[] = [];
    let scope = { ...initialScope };
    const lines = code.split('\n');
    let lineIndex = startLine;

    if (providedInput) {
        let valueToAssign: any = providedInput.value;
        // Try to convert input to a number if possible
        if (!isNaN(Number(providedInput.value)) && providedInput.value.trim() !== '') {
            valueToAssign = Number(providedInput.value);
        }
        scope[providedInput.variable] = valueToAssign;
        // The description for the input step is already in the trace before pausing.
        // We just continue execution from the next line.
    }

    for (let i = lineIndex; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i];
        const trimmedLine = line.trim();
        
        try {
            if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                continue; // Skip empty lines and comments
            }
            
            trace.push({
                lineNumber,
                description: `Executing line: ${trimmedLine}`,
                variables: { ...scope }
            });

            // Input: var = input(...)
            const inputMatch = trimmedLine.match(/^(\w+)\s*=\s*input\((.*)\)$/);
            if (inputMatch) {
                const varName = inputMatch[1];
                const promptExpr = inputMatch[2].trim();
                const prompt = promptExpr ? evaluateExpression(promptExpr, scope) : '';
                
                // Update the last step in the trace to be an input request
                trace[trace.length-1] = {
                    ...trace[trace.length-1],
                    description: prompt || `Awaiting user input...`,
                    requiresInput: true,
                    inputVariable: varName
                };
                return { trace, error: null }; // Pause execution
            }

            // For loop: for i in range(n)
            const forLoopMatch = trimmedLine.match(/^for\s+(\w+)\s+in\s+range\((\w+)\):$/);
            if (forLoopMatch) {
                const loopVar = forLoopMatch[1];
                const loopLimitExpr = forLoopMatch[2];
                const loopLimit = evaluateExpression(loopLimitExpr, scope);

                if (typeof loopLimit !== 'number') {
                    throw new Error(`TypeError: '${loopLimitExpr}' does not evaluate to an integer`);
                }
                
                trace[trace.length-1].description = `Starting a loop that will run ${loopLimit} times.`

                const loopBody: {line: string, index: number}[] = [];
                const baseIndent = line.match(/^\s*/)?.[0].length || 0;
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j];
                    if (nextLine.trim() === '') { // Allow empty lines in body
                        j++;
                        continue;
                    }
                    const nextIndent = nextLine.match(/^\s*/)?.[0].length || 0;
                    if (nextIndent > baseIndent) {
                        loopBody.push({line: nextLine, index: j});
                    } else {
                        break;
                    }
                    j++;
                }

                for (let k = 0; k < loopLimit; k++) {
                    scope[loopVar] = k;
                    trace.push({
                        lineNumber,
                        description: `Loop iteration ${k + 1}. Set '${loopVar}' to ${k}.`,
                        variables: { ...scope }
                    });
                    
                    // Create a sub-trace for the loop body
                     const loopExecutor = await getExecutionTrace(loopBody.map(l => l.line).join('\n'), {...scope});
                     loopExecutor.trace.forEach(step => {
                        trace.push({ ...step, lineNumber: loopBody[step.lineNumber-1].index + 1 });
                        scope = {...step.variables}; // Update main scope
                     });
                     if(loopExecutor.error){
                        throw new Error(loopExecutor.error);
                     }
                }
                i = j - 1; // Continue execution after the loop
                continue;
            }

            // Assignment: var = expression
            const assignmentMatch = trimmedLine.match(/^(\w+)\s*=\s*(.*)$/);
            if (assignmentMatch) {
                const varName = assignmentMatch[1];
                const valueExpr = assignmentMatch[2];
                if(valueExpr) {
                    const value = evaluateExpression(valueExpr, scope);
                    scope[varName] = value;
                    trace[trace.length-1].description = `Assign ${JSON.stringify(value)} to '${varName}'`;
                    trace[trace.length-1].variables = {...scope};
                } else {
                    throw new Error(`SyntaxError: invalid syntax`);
                }
                continue;
            }

            // Print: print(...)
            const printMatch = trimmedLine.match(/^print\((.*)\)$/);
            if (printMatch) {
                const value = evaluateExpression(printMatch[1], scope);
                trace[trace.length-1].description = `Printing output`;
                trace[trace.length-1].output = String(value);
                continue;
            }

            throw new Error(`SyntaxError: invalid or unsupported syntax`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            const lastStep = trace.pop(); // Remove the "executing line" step
            trace.push({
                lineNumber,
                description: errorMessage,
                variables: lastStep ? lastStep.variables : {...scope},
                isError: true,
            });
            return { trace, error: errorMessage }; // Stop execution
        }
    }

    return { trace, error: null };
};