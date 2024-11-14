import StateMachine from './screenplay-state-machine.js';
import CursorManager from './cursor-manager.js';

export default class ScreenplayFormatter {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
        this.cursorManager = new CursorManager(stateMachine);
        this.autoFormatEnabled = true;
    }

    // Enhanced auto-formatting method
    autoFormat(content, cursorPosition) {
        if (!this.autoFormatEnabled) return { content, cursorPosition };

        const lines = content.split('\n');
        const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);

        if (currentLineIndex !== -1) {
            const currentLine = lines[currentLineIndex];
            const formattedLine = this.stateMachine.formatLine(currentLine);

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
            const updatedLine = this.stateMachine.formatLine(updatedLines[currentLineIndex]);
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
        const tabResult = this.stateMachine.handleTab(isShiftPressed);
        this.cursorManager.trackCursorInteraction(
            tabResult.newSection, 
            'tab', 
            0, 
            this.stateMachine.cursorConfig.defaultIndents[tabResult.newSection] || 0
        );
        return tabResult;
    }

    handleEnterKey(currentLine) {
        const enterResult = this.stateMachine.handleEnter(currentLine);
        const cursorResult = this.cursorManager.calculateCursorPosition(
            currentLine, 
            0, 
            'enter'
        );
        return enterResult;
    }

    // Comprehensive line formatting method
    formatLine(line) {
        return this.stateMachine.formatLine(line);
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

    // Toggle auto-formatting
    setAutoFormatting(enabled) {
        this.autoFormatEnabled = enabled;
    }

    // Debugging method to get cursor interaction history
    getCursorInteractionHistory() {
        return this.cursorManager.getCursorInteractionHistory();
    }
}
