export default class ScreenplayStateMachine {
    constructor(options = {}) {
        // Existing constructor code remains unchanged
        
        // Add cursor behavior configuration
        this.cursorConfig = {
            sectionIndents: {
                'SCENE_HEADING': 0,
                'ACTION': 0,
                'CHARACTER_NAME': 40,
                'PARENTHETICAL': 4,
                'DIALOGUE': 4,
                'TRANSITION': 70
            },
            recommendedLineLength: {
                'SCENE_HEADING': 60,
                'ACTION': 60,
                'CHARACTER_NAME': 80,
                'PARENTHETICAL': 40,
                'DIALOGUE': 50,
                'TRANSITION': 20
            }
        };
    }

    // Existing methods remain unchanged...

    // New cursor-related utility methods
    calculateIdealCursorPosition(line, currentSection) {
        const context = this.detectContext(line);
        const indent = this.cursorConfig.sectionIndents[context] || 0;
        const recommendedLength = this.cursorConfig.recommendedLineLength[context] || line.length;

        // Intelligent cursor positioning
        switch(context) {
            case 'SCENE_HEADING':
                return Math.min(line.length, recommendedLength);
            
            case 'CHARACTER_NAME':
                return Math.max(indent, Math.min(line.length, recommendedLength));
            
            case 'PARENTHETICAL':
            case 'DIALOGUE':
                return indent + Math.min(line.length - indent, recommendedLength - indent);
            
            case 'TRANSITION':
                return line.length;
            
            default:
                return line.length;
        }
    }

    suggestNextSection(currentSection, isForward = true) {
        const sectionOrder = [
            'SCENE_HEADING', 
            'ACTION', 
            'CHARACTER_NAME', 
            'PARENTHETICAL', 
            'DIALOGUE', 
            'TRANSITION'
        ];

        const currentIndex = sectionOrder.indexOf(currentSection);
        const newIndex = isForward 
            ? (currentIndex + 1) % sectionOrder.length
            : (currentIndex - 1 + sectionOrder.length) % sectionOrder.length;

        return sectionOrder[newIndex];
    }

    // Enhanced handleTab to provide more context
    handleTab(reverse = false) {
        const newSection = this.suggestNextSection(
            this.state.currentSection, 
            !reverse
        );

        this.state.currentSection = newSection;
        return {
            newSection: newSection,
            recommendedLineLength: this.cursorConfig.recommendedLineLength[newSection] || 60
        };
    }

    // Existing methods remain the same...
    // (All previous methods like formatLine, detectContext, etc. remain unchanged)
}
