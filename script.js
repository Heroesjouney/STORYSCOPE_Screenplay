import config from './config.js';
import { ErrorLogger } from './utils.js';
import ExportService from './export-service.js';
import StateMachine from './screenplay-state-machine.js';
import SceneManager from './scene-manager.js';
import ScreenplayEditor from './screenplay-editor.js';

// Fallback logging function
function fallbackDebugLog(message, type = 'log') {
    console[type](message);
    
    // Try to log to page if debug container exists
    const debugContainer = document.getElementById('debug-log');
    if (debugContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `debug-entry ${type}`;
        logEntry.textContent = `[${type.toUpperCase()}] ${message}`;
        debugContainer.appendChild(logEntry);
    }
}

// Global utility object to simulate window-based interactions
const utils = {
    debugLog: (message, type = 'log') => {
        try {
            // First, try to use the imported debugLog
            import('./utils.js').then(module => {
                if (typeof module.debugLog === 'function') {
                    module.debugLog(message, type);
                } else {
                    fallbackDebugLog(message, type);
                }
            }).catch(() => {
                fallbackDebugLog(message, type);
            });
        } catch (error) {
            fallbackDebugLog(message, type);
        }
    }
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

        // Use fallback logging
        utils.debugLog('Screenplay Editor Initialized', 'success');
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
            utils.debugLog(`Exported screenplay in ${exportFormat} format`, 'info');
        } catch (error) {
            console.error('Export Failed:', error);
            try {
                ErrorLogger.log(error, 'Export Failed');
            } catch (logError) {
                console.error('Fallback error logging failed:', logError);
            }
        }
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.darkMode', false);
        const newMode = !currentMode;
        
        config.set('ui.darkMode', newMode);
        document.body.classList.toggle('dark-mode', newMode);
        
        utils.debugLog(`Dark Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });

    // Distraction Free Mode Toggle
    distractionFreeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.distractionFreeMode', false);
        const newMode = !currentMode;
        
        config.set('ui.distractionFreeMode', newMode);
        document.body.classList.toggle('distraction-free', newMode);
        
        utils.debugLog(`Distraction Free Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });
}

// Ensure the functions are available globally if needed
window.initializeScreenplayEditor = initializeScreenplayEditor;
window.setupToolbarEvents = setupToolbarEvents;
