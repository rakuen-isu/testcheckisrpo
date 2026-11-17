
import { spawn } from 'child_process';

export interface RunResult {
    output: string;
    error: string;
    code: number | null;
    timedOut: boolean;
}

export function runProgram(
    executable: string,
    input: string,
    timeoutMs: number = 2000
): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(executable);

        let output = '';
        let errorOutput = '';
        let timedOut = false;
        let finished = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, timeoutMs);

        function fail(error: Error) {
            if (finished) return;

            finished = true;
            clearTimeout(timer);
            reject(error);
        }

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.stdin.on('error', (error) => {
            if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
                fail(error);
            }
        });

        child.on('error', (error) => {
            fail(error);
        });

        child.on('close', (code) => {
            if (finished) return;

            finished = true;
            clearTimeout(timer);

            resolve({
                output,
                error: errorOutput,
                code,
                timedOut
            });
        });

        child.stdin.end(input);
    });
}
