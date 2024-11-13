class ErrorLogger {
    static log(error, context = '', severity = 'error') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || error,
            stack: error.stack,
            context,
            severity
        };
        
        // Console logging
        console[severity](JSON.stringify(logEntry, null, 2));
        
        // Optional: DOM-based error display
        this.displayErrorOnPage(logEntry);
    }

    static displayErrorOnPage(logEntry) {
        const errorContainer = document.getElementById('module-error');
        if (errorContainer) {
            const errorElement = document.createElement('div');
            errorElement.classList.add('error-log-entry', `error-${logEntry.severity}`);
            errorElement.innerHTML = `
                <strong>${logEntry.timestamp}</strong>
                <p>${logEntry.message}</p>
                ${logEntry.context ? `<small>Context: ${logEntry.context}</small>` : ''}
            `;
            errorContainer.appendChild(errorElement);
        }
    }

    static setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.log(event.error || event.message, 'Global Error Handler');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.log(event.reason, 'Unhandled Promise Rejection');
        });
    }
}

// Utility functions
function createDebugLogElement() {
    const debugContainer = document.getElementById('debug-log');
    if (!debugContainer) {
        const container = document.createElement('div');
        container.id = 'debug-log';
        document.body.appendChild(container);
        return container;
    }
    return debugContainer;
}

function debugLog(message, type = 'log') {
    const debugContainer = createDebugLogElement();
    const logEntry = document.createElement('div');
    logEntry.classList.add('debug-entry', `debug-${type}`);
    logEntry.textContent = `[${new Date().toISOString()}] ${message}`;
    debugContainer.appendChild(logEntry);

    // Also log to console
    console[type](message);
}

// Performance measurement utility
function measurePerformance(fn, label = 'Function') {
    return function(...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const end = performance.now();
        debugLog(`${label} execution time: ${end - start}ms`, 'performance');
        return result;
    };
}

// Initialize global error handling
ErrorLogger.setupGlobalErrorHandling();

// Export utilities
export {
    ErrorLogger,
    debugLog,
    createDebugLogElement,
    measurePerformance
};
