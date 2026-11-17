
export type TestStatus = 'Passed' | 'Failed' | 'Error' | 'Timeout';

export interface TestResult {
    testNumber: number;
    testName: string;
    status: TestStatus;
    expected: string;
    actual: string;
    executionTime: number;
    error?: string;
}

export interface TestStatistics {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    timeouts: number;
    results: TestResult[];
}

export function createStatistics(results: TestResult[]): TestStatistics {
    return {
        total: results.length,
        passed: results.filter(r => r.status === 'Passed').length,
        failed: results.filter(r => r.status === 'Failed').length,
        errors: results.filter(r => r.status === 'Error').length,
        timeouts: results.filter(r => r.status === 'Timeout').length,
        results
    };
}
