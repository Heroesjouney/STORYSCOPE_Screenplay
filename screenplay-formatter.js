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
    }

    // Enhanced defensive auto-formatting method
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

    // Safe line formatting with fallback
    safeFormatLine(line) {
        try {
            // Ensure stateMachine and formatLine method exist
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

    // Default formatting fallback
    defaultFormatLine(line) {
        // Basic formatting fallback
        return line.charAt(0).toUpperCase() + line.slice(1).trim();
    }

    handleInput(content, cursorPosition) {
        try {
            const { content: formattedContent, cursorPosition: newCursorPosition } = 
                this.autoFormat(content, cursorPosition);
            
            return {
                formattedContent,
                newCursorPosition
            };
        } catch (error) {
            console.error(`Input auto-formatting error: ${error.message}`);
            return { formattedContent: content, newCursorPosition: cursorPosition };
        }
    }

    handleSpacebar(content, cursorPosition) {
        const lines = content.split('\n');
        const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);
        
        if (currentLineIndex !== -1) {
            const currentLine = lines[currentLineIndex];
            const cursorResult = this.cursorManager.calculateCursorPosition(
                currentLine, 
                cursorPosition, 
                'spacebar'
            );
            
            // Insert space at the cursor position
            const newContent = 
                content.slice(0, cursorPosition) + 
                ' ' + 
                content.slice(cursorPosition);
            
            // Perform additional formatting on the line
            const updatedLines = newContent.split('\n');
            const updatedLine = this.safeFormatLine(updatedLines[currentLineIndex]);
            updatedLines[currentLineIndex] = updatedLine;
            
            // Auto-format the entire content
            const { content: finalContent, cursorPosition: finalCursorPosition } = 
                this.autoFormat(updatedLines.join('\n'), cursorResult.position + 1);
            
            return {
                content: finalContent,
                newCursorPosition: finalCursorPosition
            };
        }

        return {
            content: content,
            newCursorPosition: cursorPosition
        };
    }

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

    handleEnterKey(currentLine) {
        try {
            const enterResult = this.stateMachine.handleEnter(currentLine);
            const cursorResult = this.cursorManager.calculateCursorPosition(
                currentLine, 
                0, 
                'enter'
            );
            return enterResult;
        } catch (error) {
            console.error('Enter key handling error:', error);
            return { currentSection: 'SCENE_HEADING' };
        }
    }

    formatLine(line) {
        return this.safeFormatLine(line);
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

    setAutoFormatting(enabled) {
        this.autoFormatEnabled = enabled;
    }

    getCursorInteractionHistory() {
        return this.cursorManager.getCursorInteractionHistory();
    }
}
