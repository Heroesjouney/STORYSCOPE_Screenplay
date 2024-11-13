// Debugging utility functions
export function debugLog(message, type = 'log', options = {}) {
    const { 
        showOnScreen = false, 
        consoleOnly = false 
    } = options;

    // Console logging
    if (!consoleOnly) {
        const logType = ['log', 'warn', 'error', 'info'].includes(type) ? type : 'log';
        console[logType](message);
    }

    // Screen logging (optional)
    if (showOnScreen) {
        const debugContainer = document.getElementById('debug-log');
        if (debugContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `debug-entry ${type}`;
            logEntry.textContent = `[${type.toUpperCase()}] ${message}`;
            debugContainer.appendChild(logEntry);
        }
    }
}

// Enhanced Error Logging Utility
export class ErrorLogger {
    static log(error, context = '', severity = 'error', options = {}) {
        const { 
            showOnScreen = false, 
            consoleOnly = false 
        } = options;

        // Create log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace',
            context,
            severity: ['error', 'warn', 'info', 'log'].includes(severity) ? severity : 'error'
        };

        // Safe logging
        try {
            if (!consoleOnly) {
                if (typeof console !== 'undefined' && typeof console[logEntry.severity] === 'function') {
                    console[logEntry.severity](
                        `[${logEntry.severity.toUpperCase()}] ${context}: ${logEntry.message}`,
                        logEntry
                    );
                } else {
                    console.log('Logging failed', logEntry);
                }
            }

            // Optional screen logging
            if (showOnScreen) {
                const errorContainer = document.getElementById('module-error');
                if (errorContainer) {
                    const errorElement = document.createElement('div');
                    errorElement.className = `error-entry ${logEntry.severity}`;
                    errorElement.innerHTML = `
                        <strong>[${logEntry.severity.toUpperCase()}]</strong>
                        <span>${logEntry.context}: ${logEntry.message}</span>
                        <small>${logEntry.timestamp}</small>
                    `;
                    errorContainer.appendChild(errorElement);
                }
            }
        } catch (logError) {
            console.log('Logging failed', logEntry);
        }

        return logEntry;
    }

    static setupGlobalErrorHandling() {
        // Global error event listeners
        window.addEventListener('error', (event) => {
            this.log(
                event.error || event.message, 
                'Global Error Handler', 
                'error',
                { consoleOnly: true }
            );
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.log(
                event.reason, 
                'Unhandled Promise Rejection', 
                'error',
                { consoleOnly: true }
            );
        });
    }
}

// Performance measurement utility
export function measurePerformance(fn, label = 'Function') {
    return function(...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const end = performance.now();
        
        debugLog(`${label} execution time: ${end - start}ms`, 'performance', { consoleOnly: true });
        
        return result;
    };
}
