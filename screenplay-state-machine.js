export default class ScreenplayStateMachine {
    constructor(options = {}) {
        this.config = {
            maxCacheSize: options.maxCacheSize || 1000,
            maxFrequentHeadings: options.maxFrequentHeadings || 10,
            maxCharacterNames: options.maxCharacterNames || 50,
            maxSceneLocations: options.maxSceneLocations || 50,
            cacheEvictionStrategy: options.cacheEvictionStrategy || 'lru'
        };

        this.cache = new Map();
        this.characters = new Map();
        this.scenes = new Map();
        this.characterVariations = new Map();
        this.sceneHeadings = new Map();

        this.CONTEXT_REGEX = {
            SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+/i,
            CHARACTER_NAME: /^[A-Z][A-Z\s]+$/,
            TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i,
            PARENTHETICAL: /^\s*\([^)]+\)$/,
            DIALOGUE: /^\s{4}[A-Za-z]/
        };

        this.SCENE_HEADING_PREFIXES = Object.freeze([
            'INT.', 'EXT.', 'EST.', 'INT/EXT.', 'I/E.',
            'int.', 'ext.', 'est.', 'int/ext.', 'i/e.'
        ]);

        this.TIME_OF_DAY_OPTIONS = ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING'];

        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null
        };
    }

    detectContext(line) {
        const trimmedLine = line.trim();
        
        // Check cache first
        const cachedContext = this.cache.get(trimmedLine);
        if (cachedContext) {
            return cachedContext;
        }

        // Enhanced scene heading detection
        const hasSceneHeadingPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
            trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
        );

        // Comprehensive context detection
        let context = 'ACTION';
        
        if (hasSceneHeadingPrefix && this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine)) {
            context = 'SCENE_HEADING';
        } else if (this.CONTEXT_REGEX.CHARACTER_NAME.test(trimmedLine)) {
            context = 'CHARACTER_NAME';
        } else if (this.CONTEXT_REGEX.TRANSITION.test(trimmedLine)) {
            context = 'TRANSITION';
        } else if (this.CONTEXT_REGEX.PARENTHETICAL.test(trimmedLine)) {
            context = 'PARENTHETICAL';
        } else if (this.CONTEXT_REGEX.DIALOGUE.test(trimmedLine)) {
            context = 'DIALOGUE';
        }

        // Additional checks for scene heading
        if (context === 'ACTION' && hasSceneHeadingPrefix) {
            context = 'SCENE_HEADING';
        }

        // Cache the result
        this.cache.set(trimmedLine, context);
        return context;
    }

    // Rest of the methods remain the same as in the previous implementation
    formatLine(line) {
        const trimmedLine = line.trim();
        const context = this.detectContext(trimmedLine);

        switch(context) {
            case 'SCENE_HEADING':
                const matchingPrefix = this.SCENE_HEADING_PREFIXES.find(prefix => 
                    trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
                );

                if (matchingPrefix) {
                    const uppercasePrefix = matchingPrefix.toUpperCase();
                    const locationPart = trimmedLine.slice(matchingPrefix.length).trim();
                    const uppercaseLocation = locationPart.toUpperCase();
                    
                    const timeOfDayMatch = this.TIME_OF_DAY_OPTIONS.find(time => 
                        uppercaseLocation.includes(time)
                    );

                    if (!timeOfDayMatch && locationPart.includes('-')) {
                        return `${uppercasePrefix} ${uppercaseLocation}`;
                    }

                    return `${uppercasePrefix} ${uppercaseLocation}`;
                }
                return trimmedLine.toUpperCase();

            case 'CHARACTER_NAME':
                return trimmedLine.toUpperCase().padStart(40, ' ').padEnd(80, ' ');

            case 'TRANSITION':
                return trimmedLine.toUpperCase().padStart(80);

            case 'ACTION':
                return trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1);

            case 'PARENTHETICAL':
                return trimmedLine.padStart(4);

            case 'DIALOGUE':
                return trimmedLine.padStart(4);

            default:
                return trimmedLine;
        }
    }

    detectContext(line) {
        const trimmedLine = line.trim();
        const cachedContext = this.cache.get(trimmedLine);
        if (cachedContext) {
            return cachedContext;
        }

        let context = 'ACTION';
        if (this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine)) {
            context = 'SCENE_HEADING';
        } else if (this.CONTEXT_REGEX.CHARACTER_NAME.test(trimmedLine)) {
            context = 'CHARACTER_NAME';
        } else if (this.CONTEXT_REGEX.TRANSITION.test(trimmedLine)) {
            context = 'TRANSITION';
        } else if (this.CONTEXT_REGEX.PARENTHETICAL.test(trimmedLine)) {
            context = 'PARENTHETICAL';
        } else if (this.CONTEXT_REGEX.DIALOGUE.test(trimmedLine)) {
            context = 'DIALOGUE';
        }

        this.cache.set(trimmedLine, context);
        return context;
    }

    handleTab(reverse = false) {
        const currentSection = this.state.currentSection;
        const sectionOrder = [
            'SCENE_HEADING', 
            'ACTION', 
            'CHARACTER_NAME', 
            'PARENTHETICAL', 
            'DIALOGUE'
        ];

        const currentIndex = sectionOrder.indexOf(currentSection);
        const newIndex = reverse 
            ? (currentIndex - 1 + sectionOrder.length) % sectionOrder.length
            : (currentIndex + 1) % sectionOrder.length;

        this.state.currentSection = sectionOrder[newIndex];

        return {
            newSection: this.state.currentSection,
            recommendedLineLength: 60
        };
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

    _analyzeCursorStability(line, cursorPosition) {
        const context = this.detectContext(line);
        
        // Track context stability
        const contextStabilityCount = (this._cursorTracking.contextStability.get(context) || 0) + 1;
        this._cursorTracking.contextStability.set(context, contextStabilityCount);

        // Store spacebar positions
        this._cursorTracking.spacebarPositions.push({
            position: cursorPosition,
            context: context,
            timestamp: Date.now()
        });

        // Limit buffer size
        if (this._cursorTracking.spacebarPositions.length > 10) {
            this._cursorTracking.spacebarPositions.shift();
        }

        return {
            context: context,
            stabilityScore: contextStabilityCount,
            recommendedPosition: this.calculateIdealCursorPosition(line, context)
        };
    }

    calculateIdealCursorPosition(line, context) {
        const indent = this.cursorConfig.sectionIndents[context] || 0;
        const recommendedLength = this.cursorConfig.recommendedLineLength[context] || line.length;

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

    _suggestCursorPosition(line, currentPosition) {
        const stabilityAnalysis = this._analyzeCursorStability(line, currentPosition);
        
        // If context is stable, try to maintain current position
        if (stabilityAnalysis.stabilityScore > 3) {
            return {
                maintainPosition: true,
                position: currentPosition
            };
        }

        return {
            maintainPosition: false,
            position: stabilityAnalysis.recommendedPosition
        };
    }

    handleSpacebar(line, cursorPosition) {
        const context = this.detectContext(line);
        const newPosition = cursorPosition + 1; // Move cursor one position to the right

        // Ensure the new position is within the bounds of the line
        if (newPosition > line.length) {
            return cursorPosition;
        }

        return newPosition;
    }

    // Additional utility methods to ensure compatibility
    getContext(line) {
        return this.detectContext(line);
    }

    reset() {
        this.cache.clear();
        this.state.currentSection = 'SCENE_HEADING';
        this.state.currentCharacter = null;
    }
}