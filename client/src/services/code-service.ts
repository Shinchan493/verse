import API from './api';

export interface ExecutionResult {
  language: string;
  version: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  compileOutput?: string;
}

export interface ExecutePayload {
  language: string;
  code: string;
  stdin?: string;
}

const CodeService = {
  execute: (accessToken: string, payload: ExecutePayload) => {
    return API.post<ExecutionResult>('code/execute', payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};

export default CodeService;
