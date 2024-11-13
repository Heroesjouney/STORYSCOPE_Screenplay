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
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : 'No stack trace',
            context,
            severity
        };

        // Log to console
        console[severity](
            `[${severity.toUpperCase()}] ${context}: ${logEntry.message}`,
            logEntry
        );

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

// Debugging utility functions
export function debugLog(message, type = 'log') {
    const debugContainer = document.getElementById('debug-log');
    
    // Log to console
    console[type](message);

    // Log to page if container exists
    if (debugContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `debug-entry ${type}`;
        logEntry.textContent = `[${type.toUpperCase()}] ${message}`;
        debugContainer.appendChild(logEntry);
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
