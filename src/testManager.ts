
import * as fs from 'fs/promises';
import * as path from 'path';

import { runProgram } from './testRunner';
import { createStatistics, TestResult } from './statistics';

function normalize(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
}

export async function runAllTests(
    executable: string,
    testsDirectory: string,
    timeoutMs: number = 2000
) {
    const files = await fs.readdir(testsDirectory);

    const testNames = files
        .filter(file => file.endsWith('.in'))
        .map(file => path.basename(file, '.in'))
        .sort((a, b) => a.localeCompare(b, undefined, {
            numeric: true
        }));

    const results: TestResult[] = [];

    for (let i = 0; i < testNames.length; i++) {
        const testName = testNames[i];

        const inputPath = path.join(testsDirectory, `${testName}.in`);
        const outputPath = path.join(testsDirectory, `${testName}.out`);

        let input = '';
        let expected = '';

        try {
            input = await fs.readFile(inputPath, 'utf-8');
            expected = await fs.readFile(outputPath, 'utf-8');
        } catch (error) {
            results.push({
                testNumber: i + 1,
                testName,
                status: 'Error',
                expected,
                actual: '',
                executionTime: 0,
                error: `Test "${testName}": ${String(error)}`
            });

            continue;
        }

        const startTime = Date.now();

        try {
            const result = await runProgram(
                executable,
                input,
                timeoutMs
            );

            const executionTime = Date.now() - startTime;

            let status: TestResult['status'];

            if (result.timedOut) {
                status = 'Timeout';
            } else if (result.code !== 0) {
                status = 'Error';
            } else if (
                normalize(result.output) === normalize(expected)
            ) {
                status = 'Passed';
            } else {
                status = 'Failed';
            }

            results.push({
                testNumber: i + 1,
                testName,
                status,
                expected,
                actual: result.output,
                executionTime,
                error: result.error || undefined
            });

        } catch (error) {
            results.push({
                testNumber: i + 1,
                testName,
                status: 'Error',
                expected,
                actual: '',
                executionTime: Date.now() - startTime,
                error: String(error)
            });
        }
    }

    return createStatistics(results);
}
