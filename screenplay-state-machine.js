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

        this.TIME_OF_DAY_OPTIONS = [
            'DAY', 'NIGHT', 'MORNING', 
            'AFTERNOON', 'EVENING', 
            'DAWN', 'DUSK', 'SUNSET', 
            'SUNRISE', 'MIDNIGHT'
        ];

        this._cursorTracking = {
            lastContext: null,
            lastLineType: null
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
            defaultIndents: {
                'SCENE_HEADING': 0,
                'CHARACTER_NAME': 40,
                'PARENTHETICAL': 4,
                'DIALOGUE': 4,
                'TRANSITION': 80,
                'ACTION': 0
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

        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null
        };
    }

    // Enhanced context detection method
    detectContext(line) {
        const trimmedLine = line.trim();
        
        // Early return for empty lines
        if (!trimmedLine) return 'ACTION';

        // Cached context check
        const cachedContext = this.cache.get(trimmedLine);
        if (cachedContext) return cachedContext;

        // Comprehensive scene heading detection
        const hasSceneHeadingPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
            trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
        );

        // Detailed context detection with enhanced logging
        let context = 'ACTION';
        
        if (hasSceneHeadingPrefix) {
            // More lenient scene heading detection
            if (this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine) || 
                trimmedLine.split(/\s+/).length > 1) {
                context = 'SCENE_HEADING';
            }
        } else if (this.CONTEXT_REGEX.CHARACTER_NAME.test(trimmedLine)) {
            context = 'CHARACTER_NAME';
        } else if (this.CONTEXT_REGEX.TRANSITION.test(trimmedLine)) {
            context = 'TRANSITION';
        } else if (this.CONTEXT_REGEX.PARENTHETICAL.test(trimmedLine)) {
            context = 'PARENTHETICAL';
        } else if (this.CONTEXT_REGEX.DIALOGUE.test(trimmedLine)) {
            context = 'DIALOGUE';
        }

        // Verbose logging for debugging
        console.log('Context Detection Debug:', {
            line: trimmedLine,
            detectedContext: context,
            hasPrefix: hasSceneHeadingPrefix
        });

        // Cache the result
        this.cache.set(trimmedLine, context);
        return context;
    }

    // Refined cursor positioning method
    handleSpacebar(line, cursorPosition) {
        const context = this.detectContext(line);
        const indent = this.cursorConfig.sectionIndents[context] || 0;

        console.log('Spacebar Handling Debug:', {
            line,
            cursorPosition,
            context,
            indent
        });

        // Context-specific spacebar handling
        switch(context) {
            case 'SCENE_HEADING':
                // More flexible spacebar handling for scene headings
                const hasPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
                    line.toUpperCase().trim().startsWith(prefix.toUpperCase())
                );
                
                if (hasPrefix) {
                    // Allow spacebar with more intelligent positioning
                    const newPosition = Math.min(cursorPosition + 1, line.length);
                    return {
                        content: line,
                        newCursorPosition: newPosition
                    };
                }
                break;

            case 'CHARACTER_NAME':
            case 'PARENTHETICAL':
            case 'DIALOGUE':
            case 'TRANSITION':
                // Respect minimum indentation
                if (cursorPosition < indent) {
                    return {
                        content: line,
                        newCursorPosition: indent
                    };
                }
                break;
        }

        // Standard cursor movement
        const newPosition = Math.min(cursorPosition + 1, line.length);
        return {
            content: line,
            newCursorPosition: newPosition
        };
    }

    formatLine(line) {
        try {
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
        } catch (error) {
            console.error(`Formatting error for line: ${line}`, error);
            return line;
        }
    }

    // Tab key handling method
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

    // Enter key handling method
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

    // Reset method
    reset() {
        this.cache.clear();
        this.state.currentSection = 'SCENE_HEADING';
        this.state.currentCharacter = null;
    }
}
