// Debugging utility functions
export function debugLog(message, type = 'log') {
    // Ensure type is a valid console method
    const logType = ['log', 'warn', 'error', 'info'].includes(type) ? type : 'log';
    
    // Safe console logging
    if (typeof console !== 'undefined' && typeof console[logType] === 'function') {
        console[logType](message);
    } else {
        console.log(message);
    }

    // Log to page if container exists
    const debugContainer = document.getElementById('debug-log');
    if (debugContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `debug-entry ${logType}`;
        logEntry.textContent = `[${logType.toUpperCase()}] ${message}`;
        debugContainer.appendChild(logEntry);
    }
}

// Enhanced Error Logging Utility
export class ErrorLogger {
    static #errorContainer = null;
    static #debugContainer = null;

    static log(error, context = '', severity = 'error') {
        // Ensure error containers are initialized
        this.#initializeContainers();

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
            if (typeof console !== 'undefined' && typeof console[logEntry.severity] === 'function') {
                console[logEntry.severity](
                    `[${logEntry.severity.toUpperCase()}] ${context}: ${logEntry.message}`,
                    logEntry
                );
            } else {
                console.log(
                    `[ERROR] ${context}: ${logEntry.message}`,
                    logEntry
                );
            }
        } catch (logError) {
            console.log('Logging failed', logEntry);
        }

        // Display on page if debug container exists
        this.displayErrorOnPage(logEntry);

        return logEntry;
    }

    static #initializeContainers() {
        if (!this.#errorContainer) {
            this.#errorContainer = document.getElementById('module-error') || 
                this.#createErrorContainer();
        }
        if (!this.#debugContainer) {
            this.#debugContainer = document.getElementById('debug-log') || 
                this.#createDebugContainer();
        }
    }

    static #createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'module-error';
        container.className = 'error-container';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    static #createDebugContainer() {
        const container = document.createElement('div');
        container.id = 'debug-log';
        container.className = 'debug-container';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    static displayErrorOnPage(logEntry) {
        if (!this.#errorContainer) return;

        const errorElement = document.createElement('div');
        errorElement.className = `error-entry ${logEntry.severity}`;
        errorElement.innerHTML = `
            <strong>[${logEntry.severity.toUpperCase()}]</strong>
            <span>${logEntry.context}: ${logEntry.message}</span>
            <small>${logEntry.timestamp}</small>
        `;

        this.#errorContainer.appendChild(errorElement);
    }

    static setupGlobalErrorHandling() {
        // Global error event listeners
        window.addEventListener('error', (event) => {
            this.log(
                event.error || event.message, 
                'Global Error Handler', 
                'error'
            );
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.log(
                event.reason, 
                'Unhandled Promise Rejection', 
                'error'
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
        
        debugLog(`${label} execution time: ${end - start}ms`, 'performance');
        
        return result;
    };
}

// Create a debug log element if not exists
function createDebugLogElement() {
    if (!document.getElementById('debug-log')) {
        const debugLog = document.createElement('div');
        debugLog.id = 'debug-log';
        debugLog.className = 'debug-container';
        document.body.insertBefore(debugLog, document.body.firstChild);
    }
}

// Initialize debug log on module load
createDebugLogElement();
