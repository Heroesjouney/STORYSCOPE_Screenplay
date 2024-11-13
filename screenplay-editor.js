(function(window) {
    class ScreenplayEditor {
        constructor(stateMachine, sceneManager, options = {}) {
            this.stateMachine = stateMachine;
            this.sceneManager = sceneManager;
            this.editorElement = document.getElementById('screenplay-editor');
            this.timeDropdown = document.getElementById('time-of-day-dropdown');
            this.options = options;
            this.updatesEnabled = !options.suppressInitialUpdates;
            this.lastContent = '';
            
            this.initializeEditor();
            this.setupEventListeners();
            this.setupDropdowns();
            
            window.utils.debugLog('Screenplay Editor initialized');
        }

        initializeEditor() {
            try {
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
                        span.addEventListener('click', () => {
                            const timeValue = span.dataset.value;
                            this.insertTimeOfDay(timeValue);
                            this.hideTimeDropdown();
                        });
                    });
                }
            }
        }

        insertTimeOfDay(timeValue) {
            const content = this.editorElement.value;
            const cursorPos = this.editorElement.selectionStart;
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, cursorPos);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                if (this.stateMachine.detectContext(currentLine) === 'SCENE_HEADING') {
                    // Remove any existing time of day and hyphen
                    let newLine = currentLine;
                    if (currentLine.includes('-')) {
                        newLine = currentLine.split('-')[0].trim();
                    }
                    
                    // Add the new time of day
                    lines[currentLineIndex] = `${newLine} - ${timeValue}`;
                    
                    // Update content
                    this.editorElement.value = lines.join('\n');
                    
                    // Update cursor position to end of line
                    const newPos = lines.slice(0, currentLineIndex + 1).join('\n').length;
                    this.editorElement.setSelectionRange(newPos, newPos);
                }
            }
        }

        enableUpdates() {
            this.updatesEnabled = true;
        }

        setupEventListeners() {
            let inputTimeout;
            this.editorElement.addEventListener('input', (event) => {
                if (!this.updatesEnabled) return;
                
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    this.handleInput(event);
                }, 100);

                // Handle dropdown visibility
                this.checkForTimeDropdown();
            });

            this.editorElement.addEventListener('keydown', (event) => {
                if (!this.updatesEnabled) return;
                this.handleKeyDown(event);
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!this.timeDropdown.contains(event.target) && 
                    !this.editorElement.contains(event.target)) {
                    this.hideTimeDropdown();
                }
            });
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
                    
                    // Only show dropdown if:
                    // 1. Line is a scene heading
                    // 2. Just typed a hyphen (hyphen is at cursor position)
                    // 3. Hyphen is not part of an existing time of day
                    if (this.stateMachine.detectContext(currentLine) === 'SCENE_HEADING' && 
                        currentLine[cursorPosInLine - 1] === '-' &&
                        !currentLine.slice(0, cursorPosInLine - 1).includes('-')) {
                        this.showTimeDropdown();
                    } else {
                        this.hideTimeDropdown();
                    }
                }
            } catch (error) {
                window.utils.debugLog(`Dropdown check error: ${error.message}`, 'error');
                this.hideTimeDropdown();
            }
        }

        showTimeDropdown() {
            if (!this.timeDropdown) return;

            try {
                // Get cursor position
                const rect = this.editorElement.getBoundingClientRect();
                const cursorCoords = this.getCursorCoordinates();

                if (cursorCoords) {
                    this.timeDropdown.style.display = 'block';
                    this.timeDropdown.style.position = 'absolute';
                    this.timeDropdown.style.top = `${cursorCoords.top + 20}px`;
                    this.timeDropdown.style.left = `${cursorCoords.left}px`;
                }
            } catch (error) {
                window.utils.debugLog(`Show dropdown error: ${error.message}`, 'error');
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
            }
        }

        handleInput(event) {
            try {
                const content = this.editorElement.value;
                
                if (content === this.lastContent) return;
                this.lastContent = content;

                const lines = content.split('\n');
                const currentLineIndex = this.findCurrentLineIndex(lines, this.editorElement.selectionStart);
                
                if (currentLineIndex !== -1) {
                    const currentLine = lines[currentLineIndex];
                    const formattedLine = this.stateMachine.formatLine(currentLine);
                    
                    if (formattedLine !== currentLine) {
                        lines[currentLineIndex] = formattedLine;
                        
                        const cursorPosition = this.editorElement.selectionStart;
                        const previousContent = lines.slice(0, currentLineIndex).join('\n');
                        const newCursorPosition = previousContent.length + formattedLine.length;
                        
                        this.editorElement.value = lines.join('\n');
                        this.editorElement.setSelectionRange(newCursorPosition, newCursorPosition);
                    }
                }

                this.sceneManager.updateSceneList(lines);
            } catch (error) {
                window.utils.debugLog(`Input handling error: ${error.message}`, 'error');
            }
        }

        handleKeyDown(event) {
            try {
                switch(event.key) {
                    case 'Tab':
                        event.preventDefault();
                        this.handleTabKey(event);
                        break;
                    case 'Enter':
                        this.handleEnterKey(event);
                        break;
                    case 'Escape':
                        this.hideTimeDropdown();
                        break;
                }
            } catch (error) {
                window.utils.debugLog(`Key handling error: ${error.message}`, 'error');
            }
        }

        handleTabKey(event) {
            const isShiftPressed = event.shiftKey;
            this.stateMachine.handleTab(isShiftPressed);
            
            const content = this.editorElement.value;
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, this.editorElement.selectionStart);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                const formattedLine = this.stateMachine.formatLine(currentLine);
                lines[currentLineIndex] = formattedLine;
                
                const cursorPosition = this.editorElement.selectionStart;
                this.editorElement.value = lines.join('\n');
                this.editorElement.setSelectionRange(cursorPosition, cursorPosition);
            }
        }

        handleEnterKey(event) {
            const content = this.editorElement.value;
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, this.editorElement.selectionStart);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                this.stateMachine.handleEnter(currentLine);
                
                setTimeout(() => {
                    if (!this.updatesEnabled) return;
                    
                    const newLines = this.editorElement.value.split('\n');
                    const newLineIndex = this.findCurrentLineIndex(newLines, this.editorElement.selectionStart);
                    
                    if (newLineIndex !== -1) {
                        const newLine = newLines[newLineIndex];
                        const formattedLine = this.stateMachine.formatLine(newLine);
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

    window.ScreenplayEditor = ScreenplayEditor;
})(window);
