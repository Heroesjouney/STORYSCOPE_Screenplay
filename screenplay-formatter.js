import StateMachine from './screenplay-state-machine.js';
import CursorManager from './cursor-manager.js';

export default class ScreenplayFormatter {
    constructor(stateMachine) {
        // Defensive initialization
        if (!stateMachine) {
            console.warn('No StateMachine provided, creating default instance');
            stateMachine = new StateMachine();
        }

        this.stateMachine = stateMachine;
        this.cursorManager = new CursorManager(stateMachine);
        this.autoFormatEnabled = true;
        
        // Throttling configuration
        this.throttleDelay = 200;
        this.throttleTimer = null;
    }

    // Enhanced throttle method
    throttle(func, wait) {
        return (...args) => {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Enhanced defensive auto-formatting method with throttling
    autoFormat(content, cursorPosition) {
        if (!this.autoFormatEnabled) return { content, cursorPosition };

        try {
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);

            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                
                // Defensive line formatting with fallback
                const formattedLine = this.safeFormatLine(currentLine);

                if (formattedLine !== currentLine) {
                    lines[currentLineIndex] = formattedLine;

                    const cursorResult = this.cursorManager.calculateCursorPosition(
                        formattedLine, 
                        cursorPosition, 
                        'input'
                    );

                    return {
                        content: lines.join('\n'),
                        cursorPosition: cursorResult.position
                    };
                }
            }

            return { content, cursorPosition };
        } catch (error) {
            console.error('Auto-formatting error:', error);
            return { content, cursorPosition };
        }
    }

    // Advanced input handling with context detection
    handleInput(content, cursorPosition) {
        const throttledAutoFormat = this.throttle(this.autoFormat.bind(this), this.throttleDelay);
        
        try {
            const lines = content.split('\n');
            const lastLine = lines[lines.length - 1].trim();
            
            // Scene heading detection and normalization
            if (this.stateMachine.isSceneHeading(lastLine)) {
                const normalizedHeading = this.stateMachine.normalizeSceneHeading(lastLine);
                lines[lines.length - 1] = normalizedHeading;
                content = lines.join('\n');
            }

            const { formattedContent, newCursorPosition } = throttledAutoFormat(content, cursorPosition);
            
            return {
                formattedContent,
                newCursorPosition
            };
        } catch (error) {
            console.error(`Input auto-formatting error: ${error.message}`);
            return { 
                formattedContent: content, 
                newCursorPosition: cursorPosition 
            };
        }
    }

    // Existing methods remain the same...
    safeFormatLine(line) {
        try {
            if (!this.stateMachine || typeof this.stateMachine.formatLine !== 'function') {
                console.warn('StateMachine or formatLine method is undefined');
                return this.defaultFormatLine(line);
            }

            return this.stateMachine.formatLine(line);
        } catch (error) {
            console.error('Line formatting error:', error);
            return this.defaultFormatLine(line);
        }
    }

    defaultFormatLine(line) {
        return line.charAt(0).toUpperCase() + line.slice(1).trim();
    }

    handleSpacebar(content, cursorPosition) {
        try {
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                const spacebarResult = this.stateMachine.handleSpacebar(currentLine, cursorPosition);
                
                lines[currentLineIndex] = spacebarResult.content;
                const newContent = lines.join('\n');
                
                return {
                    content: newContent,
                    newCursorPosition: spacebarResult.newCursorPosition
                };
            }

            return {
                content: content,
                newCursorPosition: cursorPosition
            };
        } catch (error) {
            console.error('Spacebar handling error:', error);
            return {
                content: content,
                newCursorPosition: cursorPosition
            };
        }
    }

    // Existing methods for tab, enter, and other handlers...
    handleTabKey(isShiftPressed) {
        try {
            const tabResult = this.stateMachine.handleTab(isShiftPressed);
            this.cursorManager.trackCursorInteraction(
                tabResult.newSection, 
                'tab', 
                0, 
                this.stateMachine.cursorConfig.defaultIndents[tabResult.newSection] || 0
            );
            return tabResult;
        } catch (error) {
            console.error('Tab key handling error:', error);
            return { 
                newSection: 'SCENE_HEADING', 
                recommendedLineLength: 60 
            };
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

    // Additional methods for dropdown and special key handling can be added here
}
