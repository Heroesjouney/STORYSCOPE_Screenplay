import StateMachine from './screenplay-state-machine.js';
import SceneManager from './scene-manager.js';
import ScreenplayFormatter from './screenplay-formatter.js';
import { debugLog } from './utils.js';

export default class ScreenplayEditor {
    constructor(options = {}) {
        // Ensure StateMachine is properly initialized
        this.stateMachine = options.stateMachine || new StateMachine();
        
        // Pass StateMachine to SceneManager
        this.sceneManager = options.sceneManager || new SceneManager(this.stateMachine);
        
        // Initialize the formatter with the stateMachine
        this.formatter = new ScreenplayFormatter(this.stateMachine);
        
        this.editorElement = document.getElementById('screenplay-editor');
        this.timeDropdown = document.getElementById('time-of-day-dropdown');
        this.dropdownContainer = document.getElementById('dropdowns');
        this.options = options;
        this.updatesEnabled = options.suppressInitialUpdates !== true;
        this.lastContent = '';
        
        // Restore initializeEditor method
        this.initializeEditor();
        this.setupEventListeners();
        this.setupDropdowns();
        
        window.utils.debugLog('Screenplay Editor initialized');
    }

    // Restored initializeEditor method
    initializeEditor() {
        try {
            if (!this.editorElement) {
                throw new Error('Editor element not found');
            }

            this.editorElement.value = '';
            this.editorElement.style.whiteSpace = 'pre-wrap';
            this.editorElement.style.wordWrap = 'break-word';
            this.editorElement.style.overflowWrap = 'break-word';
            this.editorElement.style.boxSizing = 'border-box';
        } catch (error) {
            window.utils.debugLog(`Editor initialization error: ${error.message}`, 'error');
        }
    }

    setupDropdowns() {
        if (this.timeDropdown) {
            const timeDropdownContent = this.timeDropdown.querySelector('.dropdown-content');
            if (timeDropdownContent) {
                timeDropdownContent.querySelectorAll('span').forEach(span => {
                    span.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent event from bubbling
                        const timeValue = span.dataset.value;
                        this.insertTimeOfDay(timeValue);
                        this.hideTimeDropdown();
                    });
                });

                // Add click event to dropdown to prevent immediate closing
                this.timeDropdown.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            }
        }
    }

    checkForTimeDropdown() {
        try {
            const content = this.editorElement.value;
            const cursorPos = this.editorElement.selectionStart;
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, cursorPos);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                const cursorPosInLine = cursorPos - lines.slice(0, currentLineIndex).join('\n').length - (currentLineIndex > 0 ? 1 : 0);
                
                // Comprehensive dropdown detection logic
                const isSceneHeading = this.stateMachine.detectContext(currentLine) === 'SCENE_HEADING';
                const hasSceneHeadingPrefix = this.stateMachine.SCENE_HEADING_PREFIXES.some(prefix => 
                    currentLine.toUpperCase().trim().startsWith(prefix.toUpperCase())
                );
                const justTypedHyphen = currentLine[cursorPosInLine - 1] === '-';
                const noExistingTimeOfDay = !currentLine.slice(0, cursorPosInLine - 1).includes('-');

                console.log(`Dropdown Check: 
                    Scene Heading: ${isSceneHeading}, 
                    Has Prefix: ${hasSceneHeadingPrefix}, 
                    Just Typed Hyphen: ${justTypedHyphen}, 
                    No Existing Time: ${noExistingTimeOfDay}`
                );

                if (isSceneHeading && hasSceneHeadingPrefix && justTypedHyphen && noExistingTimeOfDay) {
                    this.showTimeDropdown();
                } else {
                    this.hideTimeDropdown();
                }
            }
        } catch (error) {
            console.error(`Dropdown check error: ${error.message}`);
            this.hideTimeDropdown();
        }
    }

    showTimeDropdown() {
        if (!this.timeDropdown || !this.dropdownContainer) return;

        try {
            // Get cursor position
            const rect = this.editorElement.getBoundingClientRect();
            const cursorCoords = this.getCursorCoordinates();

            if (cursorCoords) {
                // Position dropdown relative to the dropdown container
                const containerRect = this.dropdownContainer.getBoundingClientRect();
                
                this.timeDropdown.style.display = 'block';
                this.timeDropdown.style.position = 'absolute';
                this.timeDropdown.style.top = `${cursorCoords.top - containerRect.top + 20}px`;
                this.timeDropdown.style.left = `${cursorCoords.left - containerRect.left}px`;
                this.timeDropdown.classList.add('active');
                
                console.log('Time of Day Dropdown Shown');
            }
        } catch (error) {
            console.error(`Show dropdown error: ${error.message}`);
            this.hideTimeDropdown();
        }
    }

    getCursorCoordinates() {
        const position = this.editorElement.selectionStart;
        const text = this.editorElement.value.substring(0, position);
        const span = document.createElement('span');
        span.textContent = text;
        span.style.cssText = window.getComputedStyle(this.editorElement).cssText;
        span.style.height = 'auto';
        span.style.position = 'absolute';
        span.style.visibility = 'hidden';
        span.style.whiteSpace = 'pre-wrap';
        
        document.body.appendChild(span);
        const coordinates = {
            top: this.editorElement.offsetTop + span.offsetHeight,
            left: this.editorElement.offsetLeft + span.offsetWidth
        };
        document.body.removeChild(span);
        
        return coordinates;
    }

    hideTimeDropdown() {
        if (this.timeDropdown) {
            this.timeDropdown.style.display = 'none';
            this.timeDropdown.classList.remove('active');
        }
    }

    // Rest of the methods remain unchanged
    handleInput(event) {
        try {
            const content = this.editorElement.value;
            
            if (content === this.lastContent) return;
            this.lastContent = content;

            const cursorPosition = this.editorElement.selectionStart;
            const { formattedContent, newCursorPosition } = this.formatter.handleInput(content, cursorPosition);
            
            this.editorElement.value = formattedContent;
            this.editorElement.setSelectionRange(newCursorPosition, newCursorPosition);

            this.sceneManager.updateSceneList(formattedContent.split('\n'));
        } catch (error) {
            window.utils.debugLog(`Input handling error: ${error.message}`, 'error');
        }
    }

    // Remaining methods from the previous implementation
    handleTabKey(event) {
        const isShiftPressed = event.shiftKey;
        this.formatter.handleTabKey(isShiftPressed);
        
        const content = this.editorElement.value;
        const cursorPosition = this.editorElement.selectionStart;
        const { formattedContent, newCursorPosition } = this.formatter.handleInput(content, cursorPosition);
        
        this.editorElement.value = formattedContent;
        this.editorElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    handleEnterKey(event) {
        const content = this.editorElement.value;
        const cursorPosition = this.editorElement.selectionStart;
        const lines = content.split('\n');
        const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);
        
        if (currentLineIndex !== -1) {
            const currentLine = lines[currentLineIndex];
            this.formatter.handleEnterKey(currentLine);
            
            setTimeout(() => {
                if (!this.updatesEnabled) return;
                
                const newLines = this.editorElement.value.split('\n');
                const newLineIndex = this.findCurrentLineIndex(newLines, this.editorElement.selectionStart);
                
                if (newLineIndex !== -1) {
                    const newLine = newLines[newLineIndex];
                    const formattedLine = this.formatter.formatLine(newLine);
                    newLines[newLineIndex] = formattedLine;
                    
                    const cursorPosition = this.editorElement.selectionStart;
                    this.editorElement.value = newLines.join('\n');
                    this.editorElement.setSelectionRange(cursorPosition, cursorPosition);
                }
            }, 0);
        }
    }

    findCurrentLineIndex(lines, cursorPosition) {
        let currentPosition = 0;
        for (let i = 0; i < lines.length; i++) {
            currentPosition += lines[i].length + 1;
            if (currentPosition >= cursorPosition) {
                return i;
            }
        }
        return lines.length - 1;
    }

    export(format) {
        try {
            const content = this.editorElement.value;
            window.ExportService.export(content, format);
            window.utils.debugLog('Export completed successfully');
        } catch (error) {
            window.utils.debugLog(`Export error: ${error.message}`, 'error');
        }
    }
}
