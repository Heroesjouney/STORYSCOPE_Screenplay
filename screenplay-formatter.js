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
                    const newCursorPosition = previousContent.length + formattedLine.length + 1;
                    
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
