
export interface ExecutionStep {
  lineNumber: number;
  description: string;
  variables: Record<string, any>;
  output?: string;
  isError?: boolean;
  requiresInput?: boolean;
  inputVariable?: string;
}

export interface ExecutorResponse {
  trace: ExecutionStep[];
  error: string | null;
}
