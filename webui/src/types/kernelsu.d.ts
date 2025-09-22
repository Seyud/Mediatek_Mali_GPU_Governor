// KernelSU npm包的类型声明文件
declare module "kernelsu" {
	interface ExecOptions {
		cwd?: string;
		env?: Record<string, string>;
	}

	interface ExecResult {
		errno: number;
		stdout: string;
		stderr: string;
	}

	interface SpawnOptions {
		cwd?: string;
		env?: Record<string, string>;
	}

	interface Stdio {
		on(event: "data", listener: (data: string) => void): void;
		emit(event: string, ...args: unknown[]): void;
	}

	interface ChildProcess {
		stdin: Stdio;
		stdout: Stdio;
		stderr: Stdio;
		on(event: "exit", listener: (code: number | null) => void): void;
		on(event: "error", listener: (error: Error) => void): void;
		emit(event: string, ...args: unknown[]): void;
	}

	export function exec(command: string, options?: ExecOptions): Promise<ExecResult>;
	export function spawn(command: string, args?: string[], options?: SpawnOptions): ChildProcess;
	export function toast(message: string): void;
	export function fullScreen(isFullScreen: boolean): void;
}
