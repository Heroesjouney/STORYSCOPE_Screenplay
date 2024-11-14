import { ScreenplayTracker } from './screenplay-tracker.js';
import { ScreenplayContextDetector } from './screenplay-context-detector.js';

export class ScreenplayStateMachine {
    constructor(options = {}) {
        this.tracker = new ScreenplayTracker(options);
        this.contextDetector = new ScreenplayContextDetector();
        
        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null
        };
    }

    formatLine(line) {
        return this.contextDetector.formatLine(line);
    }

    detectContext(line) {
        return this.contextDetector.detectContext(line);
    }

    updateTracking(lines) {
        lines.forEach(line => {
            const context = this.detectContext(line.trim());
            if (context === 'CHARACTER_NAME') {
                this.tracker.trackCharacter(line.trim());
            }
            if (context === 'SCENE_HEADING') {
                this.tracker.trackScene(line.trim());
            }
        });
    }

    getCharacterSuggestions(partialName) {
        return this.tracker.getCharacterSuggestions(partialName);
    }

    getSceneSuggestions(partialHeading) {
        return this.tracker.getSceneSuggestions(partialHeading);
    }

    handleEnter(line) {
        const trimmedLine = line.trim();
        const context = this.detectContext(trimmedLine);

        switch (this.state.currentSection) {
            case 'SCENE_HEADING':
                if (context === 'SCENE_HEADING') {
                    this.state.currentSection = 'ACTION';
                } else {
                    this.state.currentSection = 'SCENE_HEADING';
                }
                break;

            case 'ACTION':
                if (context === 'CHARACTER_NAME') {
                    this.state.currentSection = 'CHARACTER_NAME';
                    this.state.currentCharacter = trimmedLine;
                } else {
                    this.state.currentSection = 'SCENE_HEADING';
                }
                break;

            case 'CHARACTER_NAME':
                if (trimmedLine) {
                    this.state.currentSection = 'PARENTHETICAL';
                } else {
                    this.state.currentSection = 'SCENE_HEADING';
                }
                break;

            case 'PARENTHETICAL':
                this.state.currentSection = 'DIALOGUE';
                break;

            case 'DIALOGUE':
                if (trimmedLine) {
                    this.state.currentSection = 'DIALOGUE';
                } else {
                    this.state.currentSection = 'SCENE_HEADING';
                }
                break;

            default:
                this.state.currentSection = 'SCENE_HEADING';
                break;
        }
    }

    handleTab(reverse = false) {
        switch (this.state.currentSection) {
            case 'SCENE_HEADING':
                this.state.currentSection = 'ACTION';
                break;

            case 'ACTION':
                this.state.currentSection = 'CHARACTER_NAME';
                break;

            case 'CHARACTER_NAME':
                this.state.currentSection = 'PARENTHETICAL';
                break;

            case 'PARENTHETICAL':
                this.state.currentSection = 'DIALOGUE';
                break;

            case 'DIALOGUE':
                this.state.currentSection = 'SCENE_HEADING';
                break;

            default:
                this.state.currentSection = 'SCENE_HEADING';
                break;
        }
    }

    reset() {
        this.tracker.reset();
        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null
        };
    }
}
