import config from './config.js';
import { ErrorLogger, debugLog } from './utils.js';
import ExportService from './export-service.js';
import ScreenplayEditor from './screenplay-editor.js';

function initializeScreenplayEditor() {
    try {
        // Initialize configuration
        const editorConfig = {
            fontSize: config.get('editor.fontSize', 12),
            fontFamily: config.get('editor.fontFamily', 'Courier New'),
            autoSave: config.get('editor.autoSave', true),
            autoSaveInterval: config.get('editor.autoSaveInterval', 5000)
        };

        // Create screenplay editor instance
        const screenplayEditor = new ScreenplayEditor(editorConfig);
        
        // Setup toolbar events
        setupToolbarEvents(screenplayEditor);

        // Initialize error handling
        ErrorLogger.setupGlobalErrorHandling();

        debugLog('Screenplay Editor Initialized', 'success');
    } catch (error) {
        ErrorLogger.log(error, 'Editor Initialization Failed');
    }
}

function setupToolbarEvents(screenplayEditor) {
    const exportButton = document.getElementById('export');
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    const distractionFreeToggle = document.getElementById('toggle-distraction-free');

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

// Initialize the editor when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeScreenplayEditor);

// Expose key functions for potential external use
export {
    initializeScreenplayEditor,
    setupToolbarEvents
};
