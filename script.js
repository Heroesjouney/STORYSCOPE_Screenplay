import config from './config.js';
import { ErrorLogger, debugLog } from './utils.js';
import ExportService from './export-service.js';
import StateMachine from './screenplay-state-machine.js';
import SceneManager from './scene-manager.js';
import ScreenplayEditor from './screenplay-editor.js';

// Robust logging function with multiple fallback mechanisms
function safeLog(message, type = 'log') {
    // Validate logging type
    const validTypes = ['log', 'warn', 'error', 'info'];
    const safeType = validTypes.includes(type) ? type : 'log';

    try {
        // Primary logging method
        if (typeof debugLog === 'function') {
            debugLog(message, safeType);
            return;
        }

        // Fallback to console logging
        if (typeof console !== 'undefined' && typeof console[safeType] === 'function') {
            console[safeType](message);
        } else {
            console.log(message);
        }

        // Attempt to log to page
        const debugContainer = document.getElementById('debug-log');
        if (debugContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `debug-entry ${safeType}`;
            logEntry.textContent = `[${safeType.toUpperCase()}] ${message}`;
            debugContainer.appendChild(logEntry);
        }
    } catch (error) {
        // Absolute fallback
        console.log(message);
    }
}

// Global utility object to simulate window-based interactions
const utils = {
    debugLog: safeLog
};

// Global export service
const exportService = {
    export: (content, format) => {
        ExportService.export(content, format);
    }
};

export function initializeScreenplayEditor() {
    try {
        // Initialize configuration
        const editorConfig = {
            fontSize: config.get('editor.fontSize', 12),
            fontFamily: config.get('editor.fontFamily', 'Courier New'),
            autoSave: config.get('editor.autoSave', true),
            autoSaveInterval: config.get('editor.autoSaveInterval', 5000)
        };

        // Create dependencies explicitly
        const stateMachine = new StateMachine();
        const sceneManager = new SceneManager(stateMachine);

        // Attach global objects to simulate window-based interactions
        window.utils = utils;
        window.ExportService = exportService;

        // Create screenplay editor instance with explicit dependencies
        const screenplayEditor = new ScreenplayEditor({
            ...editorConfig,
            stateMachine,
            sceneManager
        });
        
        // Setup toolbar events
        setupToolbarEvents(screenplayEditor);

        // Initialize error handling
        ErrorLogger.setupGlobalErrorHandling();

        // Use safe logging
        safeLog('Screenplay Editor Initialized', 'success');
        return screenplayEditor;
    } catch (error) {
        // Fallback error logging
        console.error('Editor Initialization Failed:', error);
        
        // Try to use ErrorLogger if available
        try {
            ErrorLogger.log(error, 'Editor Initialization Failed');
        } catch (logError) {
            console.error('Fallback error logging failed:', logError);
        }

        // Rethrow the original error
        throw error;
    }
}

export function setupToolbarEvents(screenplayEditor) {
    const exportButton = document.getElementById('export');
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    const distractionFreeToggle = document.getElementById('toggle-distraction-free');

    if (!exportButton || !darkModeToggle || !distractionFreeToggle) {
        const missingElements = [
            !exportButton && 'export button',
            !darkModeToggle && 'dark mode toggle',
            !distractionFreeToggle && 'distraction-free toggle'
        ].filter(Boolean).join(', ');
        
        throw new Error(`Toolbar elements not found: ${missingElements}`);
    }

    // Export functionality
    exportButton.addEventListener('click', () => {
        try {
            const content = document.getElementById('screenplay-editor').value;
            const exportFormat = config.get('export.defaultFormat', 'pdf');
            
            ExportService.export(content, exportFormat);
            safeLog(`Exported screenplay in ${exportFormat} format`, 'info');
        } catch (error) {
            safeLog(`Export Failed: ${error.message}`, 'error');
        }
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.darkMode', false);
        const newMode = !currentMode;
        
        config.set('ui.darkMode', newMode);
        document.body.classList.toggle('dark-mode', newMode);
        
        safeLog(`Dark Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });

    // Distraction Free Mode Toggle
    distractionFreeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.distractionFreeMode', false);
        const newMode = !currentMode;
        
        config.set('ui.distractionFreeMode', newMode);
        document.body.classList.toggle('distraction-free', newMode);
        
        safeLog(`Distraction Free Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });
}

// Ensure the functions are available globally if needed
window.initializeScreenplayEditor = initializeScreenplayEditor;
window.setupToolbarEvents = setupToolbarEvents;
