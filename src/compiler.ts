import { execFile } from 'child_process';
import * as path from 'path';

export function compile(source: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const output = path.join(path.dirname(source), 'program');

        execFile('g++', [source, '-o', output], (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
                return;
            }

            resolve(output);
        });
    });
}