
import * as vscode from 'vscode';
import * as path from 'path';

import { compile } from './compiler';
import { runAllTests } from './testManager';
import { showDashboard } from './dashboard';

export function activate(context: vscode.ExtensionContext) {
    const runTests = vscode.commands.registerCommand(
        'testcheckisrpo.runTests',
        async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No file is open!');
                return;
            }

            const source = editor.document.fileName;

            if (path.extname(source) !== '.cpp') {
                vscode.window.showErrorMessage(
                    'Please open a C++ file!'
                );
                return;
            }

            const workspace = vscode.workspace.getWorkspaceFolder(
                editor.document.uri
            );

            if (!workspace) {
                vscode.window.showErrorMessage(
                    'No workspace is open!'
                );
                return;
            }

            const channel = vscode.window.createOutputChannel(
                'TestCheck ISRPO'
            );

            channel.clear();
            channel.show();

            try {
                channel.appendLine('=== TestCheck ISRPO ===');
                channel.appendLine('Compiling program...\n');

                const executable = await compile(source);

                channel.appendLine('Compilation successful.');
                channel.appendLine('Running tests...\n');

                const testsDirectory = path.join(
                    workspace.uri.fsPath,
                    'tests'
                );

                const statistics = await runAllTests(
                    executable,
                    testsDirectory
                );

                for (const result of statistics.results) {
                    channel.appendLine(
                        `Test ${result.testName}: ${result.status}`
                    );

                    channel.appendLine(
                        `Execution time: ${result.executionTime} ms`
                    );

                    if (result.status === 'Failed') {
                        channel.appendLine(
                            `Expected: ${JSON.stringify(result.expected)}`
                        );

                        channel.appendLine(
                            `Actual:   ${JSON.stringify(result.actual)}`
                        );
                    }

                    if (result.error) {
                        channel.appendLine(
                            `Error: ${result.error}`
                        );
                    }

                    channel.appendLine('----------------------------');
                }

                channel.appendLine('\n=== Final statistics ===');
                channel.appendLine(`Total: ${statistics.total}`);
                channel.appendLine(`Passed: ${statistics.passed}`);
                channel.appendLine(`Failed: ${statistics.failed}`);
                channel.appendLine(`Errors: ${statistics.errors}`);
                channel.appendLine(`Timeouts: ${statistics.timeouts}`);

                showDashboard(context, statistics);

                const message =
                    `Results: ${statistics.passed}/${statistics.total} passed`;

                if (
                    statistics.total > 0 &&
                    statistics.passed === statistics.total
                ) {
                    vscode.window.showInformationMessage(message);
                } else {
                    vscode.window.showWarningMessage(message);
                }

            } catch (error) {
                channel.appendLine(`FATAL ERROR: ${String(error)}`);

                vscode.window.showErrorMessage(
                    `Test execution failed: ${String(error)}`
                );
            }
        }
    );

    context.subscriptions.push(runTests);
}

export function deactivate() {}
