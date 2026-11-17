
import * as vscode from 'vscode';
import { TestStatistics } from './statistics';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function showDashboard(
    context: vscode.ExtensionContext,
    statistics: TestStatistics
) {
    const panel = vscode.window.createWebviewPanel(
        'testcheckDashboard',
        'TestCheck ISRPO Dashboard',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    panel.webview.html = getDashboardHtml(statistics);
}

function getDashboardHtml(stats: TestStatistics): string {
    const total = stats.total || 1;

    const passed = (stats.passed / total) * 100;
    const failed = (stats.failed / total) * 100;
    const errors = (stats.errors / total) * 100;
    const timeouts = (stats.timeouts / total) * 100;

    const failedEnd = passed + failed;
    const errorsEnd = failedEnd + errors;

    const chart = `
        conic-gradient(
            #22c55e 0% ${passed}%,
            #ef4444 ${passed}% ${failedEnd}%,
            #f59e0b ${failedEnd}% ${errorsEnd}%,
            #64748b ${errorsEnd}% 100%
        )
    `;

    const testRows = stats.results.map(result => {
        const statusClass = result.status.toLowerCase();

        let details = '';

        if (result.status === 'Failed') {
            details = `
                <div class="details">
                    <p><strong>Expected:</strong></p>
                    <pre>${escapeHtml(result.expected)}</pre>

                    <p><strong>Actual:</strong></p>
                    <pre>${escapeHtml(result.actual)}</pre>
                </div>
            `;
        }

        if (result.error) {
            details += `
                <div class="details">
                    <p><strong>Error:</strong></p>
                    <pre>${escapeHtml(result.error)}</pre>
                </div>
            `;
        }

        return `
            <tr>
                <td>${escapeHtml(result.testName)}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${result.status}
                    </span>
                </td>
                <td>${result.executionTime} ms</td>
                <td>${details || '—'}</td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">

        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <title>TestCheck ISRPO</title>

        <style>
            body {
                font-family: sans-serif;
                padding: 30px;
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
            }

            h1 {
                margin-bottom: 30px;
            }

            h2 {
                margin-top: 45px;
            }

            .container {
                display: flex;
                flex-wrap: wrap;
                gap: 40px;
                align-items: center;
            }

            .chart {
                width: 220px;
                height: 220px;
                flex-shrink: 0;
                border-radius: 50%;
                background: ${chart};
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chart-center {
                width: 145px;
                height: 145px;
                border-radius: 50%;
                background: var(--vscode-editor-background);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .number {
                font-size: 32px;
                font-weight: bold;
            }

            .legend {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 16px;
            }

            .color {
                width: 14px;
                height: 14px;
                border-radius: 4px;
            }

            .passed { background: #22c55e; }
            .failed { background: #ef4444; }
            .error { background: #f59e0b; }
            .timeout { background: #64748b; }

            .cards {
                display: grid;
                grid-template-columns:
                    repeat(auto-fit, minmax(130px, 1fr));
                gap: 15px;
                margin-top: 40px;
            }

            .card {
                padding: 20px;
                border-radius: 10px;
                background: var(--vscode-sideBar-background);
            }

            .card h2 {
                font-size: 28px;
                margin: 0 0 8px;
            }

            .card p {
                margin: 0;
                opacity: 0.7;
            }

            .table-container {
                overflow-x: auto;
                margin-top: 20px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
            }

            th, td {
                padding: 14px;
                text-align: left;
                border-bottom: 1px solid
                    var(--vscode-panel-border);
                vertical-align: top;
            }

            th {
                background: var(--vscode-sideBar-background);
            }

            .status {
                font-weight: bold;
            }

            .status.passed { color: #22c55e; }
            .status.failed { color: #ef4444; }
            .status.error { color: #f59e0b; }
            .status.timeout { color: #94a3b8; }

            .details {
                margin-top: 10px;
                max-width: 450px;
            }

            .details p {
                margin-bottom: 5px;
            }

            pre {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                padding: 10px;
                border-radius: 5px;
                background: var(--vscode-textCodeBlock-background);
            }
        </style>
    </head>

    <body>
        <h1>TestCheck ISRPO</h1>

        <div class="container">
            <div class="chart">
                <div class="chart-center">
                    <div class="number">
                        ${stats.passed}/${stats.total}
                    </div>
                    <div>Passed</div>
                </div>
            </div>

            <div class="legend">
                <div class="item">
                    <div class="color passed"></div>
                    Passed: ${stats.passed}
                </div>

                <div class="item">
                    <div class="color failed"></div>
                    Failed: ${stats.failed}
                </div>

                <div class="item">
                    <div class="color error"></div>
                    Errors: ${stats.errors}
                </div>

                <div class="item">
                    <div class="color timeout"></div>
                    Timeouts: ${stats.timeouts}
                </div>
            </div>
        </div>

        <div class="cards">
            <div class="card">
                <h2>${stats.total}</h2>
                <p>Total tests</p>
            </div>

            <div class="card">
                <h2>${stats.passed}</h2>
                <p>Passed</p>
            </div>

            <div class="card">
                <h2>${stats.failed}</h2>
                <p>Failed</p>
            </div>

            <div class="card">
                <h2>${stats.errors}</h2>
                <p>Errors</p>
            </div>

            <div class="card">
                <h2>${stats.timeouts}</h2>
                <p>Timeouts</p>
            </div>
        </div>

        <h2>Test Results</h2>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Execution Time</th>
                        <th>Details</th>
                    </tr>
                </thead>

                <tbody>
                    ${testRows || `
                        <tr>
                            <td colspan="4">No tests found</td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `;
}
