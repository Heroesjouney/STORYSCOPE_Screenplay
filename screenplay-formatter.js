import StateMachine from './screenplay-state-machine.js';

export default class ScreenplayFormatter {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
    }

    handleInput(content, cursorPosition) {
        try {
            const lines = content.split('\n');
            const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);
            
            if (currentLineIndex !== -1) {
                const currentLine = lines[currentLineIndex];
                const formattedLine = this.stateMachine.formatLine(currentLine);
                
                if (formattedLine !== currentLine) {
                    lines[currentLineIndex] = formattedLine;
                    
                    const previousContent = lines.slice(0, currentLineIndex).join('\n');
                    const newCursorPosition = this.calculateNewCursorPosition(
                        previousContent, 
                        formattedLine, 
                        cursorPosition
                    );
                    
                    return {
                        formattedContent: lines.join('\n'),
                        newCursorPosition
                    };
                }
            }

            return {
                formattedContent: content,
                newCursorPosition: cursorPosition
            };
        } catch (error) {
            window.utils.debugLog(`Input handling error: ${error.message}`, 'error');
            return {
                formattedContent: content,
                newCursorPosition: cursorPosition
            };
        }
    }

    calculateNewCursorPosition(previousContent, formattedLine, originalCursorPosition) {
        const context = this.stateMachine.detectContext(formattedLine);
        
        // Maintain original cursor positioning logic
        return previousContent.length + Math.min(originalCursorPosition, formattedLine.length);
    }

    handleSpacebar(content, cursorPosition) {
        const lines = content.split('\n');
        const currentLineIndex = this.findCurrentLineIndex(lines, cursorPosition);
        
        if (currentLineIndex !== -1) {
            const currentLine = lines[currentLineIndex];
            
            // Insert space at the cursor position
            const newContent = 
                content.slice(0, cursorPosition) + 
                ' ' + 
                content.slice(cursorPosition);
            
            // Perform formatting on the entire content
            const formattedLines = newContent.split('\n').map(line => 
                this.stateMachine.formatLine(line)
            );
            
            return {
                content: formattedLines.join('\n'),
                newCursorPosition: cursorPosition + 1
            };
        }

        return {
            content: content,
            newCursorPosition: cursorPosition
        };
    }

    handleTabKey(isShiftPressed) {
        this.stateMachine.handleTab(isShiftPressed);
    }

    handleEnterKey(currentLine) {
        this.stateMachine.handleEnter(currentLine);
    }

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
}
