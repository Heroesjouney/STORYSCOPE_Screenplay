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

        // Add cursor tracking and configuration
        this._cursorTracking = {
            contextStability: new Map(),
            spacebarPositions: []
        };

        this.cursorConfig = {
            sectionIndents: {
                'SCENE_HEADING': 0,
                'CHARACTER_NAME': 40,
                'PARENTHETICAL': 4,
                'DIALOGUE': 4,
                'TRANSITION': 80,
                'ACTION': 0
            },
            recommendedLineLength: {
                'SCENE_HEADING': 60,
                'CHARACTER_NAME': 80,
                'PARENTHETICAL': 30,
                'DIALOGUE': 40,
                'TRANSITION': 40,
                'ACTION': 60
            }
        };

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

    // Existing methods remain the same...
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

    // Enhanced spacebar handling
    handleSpacebar(line, cursorPosition) {
        const context = this.detectContext(line);
        const indent = this.cursorConfig.sectionIndents[context] || 0;

        // Context-specific spacebar handling
        switch(context) {
            case 'SCENE_HEADING':
                // Allow spacebar after scene heading prefix
                const hasPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
                    line.toUpperCase().trim().startsWith(prefix.toUpperCase())
                );
                
                if (hasPrefix) {
                    // If prefix exists, allow spacebar anywhere
                    const newPosition = cursorPosition + 1;
                    return Math.min(newPosition, line.length);
                }
                break;

            case 'CHARACTER_NAME':
                // Maintain centered positioning for character names
                if (cursorPosition < indent) {
                    return indent;
                }
                break;

            case 'PARENTHETICAL':
            case 'DIALOGUE':
                // Respect indentation for dialogue and parentheticals
                if (cursorPosition < indent) {
                    return indent;
                }
                break;

            case 'TRANSITION':
                // Prevent spaces before transitions
                if (cursorPosition < indent) {
                    return indent;
                }
                break;
        }

        // Standard cursor movement
        const newPosition = cursorPosition + 1;
        return Math.min(newPosition, line.length);
    }

    // Rest of the existing methods remain the same...
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

    // Remaining methods stay the same...
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

    // Existing utility methods
    getContext(line) {
        return this.detectContext(line);
    }

    reset() {
        this.cache.clear();
        this.state.currentSection = 'SCENE_HEADING';
        this.state.currentCharacter = null;
    }
}