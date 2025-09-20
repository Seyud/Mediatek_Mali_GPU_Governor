interface ExecResult { errno: number; stdout: string; stderr: string; }
interface KsuAPI { exec(command: string, optionsJson: string, callbackName: string): void; toast(message: string): void; }
declare global { interface Window { ksu: KsuAPI; } }
export {};
