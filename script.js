import config from './config.js';
import { ErrorLogger, debugLog } from './utils.js';
import ExportService from './export-service.js';
import StateMachine from './screenplay-state-machine.js';
import SceneManager from './scene-manager.js';
import ScreenplayEditor from './screenplay-editor.js';

// Global utility object to simulate window-based interactions
const utils = {
    debugLog: (message, type = 'log') => {
        console.log(message);
        debugLog(message, type);
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

        debugLog('Screenplay Editor Initialized', 'success');
        return screenplayEditor;
    } catch (error) {
        ErrorLogger.log(error, 'Editor Initialization Failed');
        throw error;
    }
}

export function setupToolbarEvents(screenplayEditor) {
    const exportButton = document.getElementById('export');
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    const distractionFreeToggle = document.getElementById('toggle-distraction-free');

    if (!exportButton || !darkModeToggle || !distractionFreeToggle) {
        throw new Error('Toolbar elements not found');
    }

    // Export functionality
    exportButton.addEventListener('click', () => {
        try {
            const content = document.getElementById('screenplay-editor').value;
            const exportFormat = config.get('export.defaultFormat', 'pdf');
            
            ExportService.export(content, exportFormat);
            debugLog(`Exported screenplay in ${exportFormat} format`, 'info');
        } catch (error) {
            ErrorLogger.log(error, 'Export Failed');
        }
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.darkMode', false);
        const newMode = !currentMode;
        
        config.set('ui.darkMode', newMode);
        document.body.classList.toggle('dark-mode', newMode);
        
        debugLog(`Dark Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });

    // Distraction Free Mode Toggle
    distractionFreeToggle.addEventListener('click', () => {
        const currentMode = config.get('ui.distractionFreeMode', false);
        const newMode = !currentMode;
        
        config.set('ui.distractionFreeMode', newMode);
        document.body.classList.toggle('distraction-free', newMode);
        
        debugLog(`Distraction Free Mode ${newMode ? 'Enabled' : 'Disabled'}`, 'info');
    });
}

// Ensure the functions are available globally if needed
window.initializeScreenplayEditor = initializeScreenplayEditor;
window.setupToolbarEvents = setupToolbarEvents;
