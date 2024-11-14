// Centralized Cursor Management Utility
export default class CursorManager {
    constructor(stateMachine, debugLogger = console) {
        this.stateMachine = stateMachine;
        this.logger = debugLogger;
        this.cursorState = {
            lastPosition: 0,
            lastContext: null,
            interactions: []
        };
    }

    // Unified cursor positioning method
    calculateCursorPosition(line, currentPosition, action) {
        try {
            this.logger.log(`Cursor Positioning: Action=${action}, Line=${line}`);

            const context = this.stateMachine.detectContext(line);
            const indentConfig = this.stateMachine.cursorConfig.defaultIndents;
            const indent = indentConfig[context] || 0;

            let newPosition = currentPosition;

            switch(action) {
                case 'spacebar':
                    newPosition = Math.max(currentPosition + 1, indent);
                    break;
                case 'tab':
                    newPosition = indent;
                    break;
                case 'enter':
                    newPosition = indent;
                    break;
                default:
                    newPosition = Math.min(currentPosition, line.length);
            }

            // Track cursor interaction
            this.trackCursorInteraction(context, action, currentPosition, newPosition);

            return {
                position: newPosition,
                context: context
            };
        } catch (error) {
            this.logger.error('Cursor Position Calculation Error:', error);
            return {
                position: currentPosition,
                context: 'unknown'
            };
        }
    }

    // Comprehensive cursor interaction tracking
    trackCursorInteraction(context, action, oldPosition, newPosition) {
        const interaction = {
            timestamp: new Date(),
            context,
            action,
            oldPosition,
            newPosition
        };

        this.cursorState.interactions.push(interaction);
        
        // Limit interaction history
        if (this.cursorState.interactions.length > 100) {
            this.cursorState.interactions.shift();
        }

        this.cursorState.lastPosition = newPosition;
        this.cursorState.lastContext = context;
    }

    // Debugging method to get cursor interaction history
    getCursorInteractionHistory() {
        return this.cursorState.interactions;
    }

    // Reset cursor tracking
    reset() {
        this.cursorState = {
            lastPosition: 0,
            lastContext: null,
            interactions: []
        };
    }
}
