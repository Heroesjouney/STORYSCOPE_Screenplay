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

        // Enhanced Time of Day Options
        this.TIME_OF_DAY_OPTIONS = {
            standard: ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING'],
            specific: ['DAWN', 'DUSK', 'SUNSET', 'SUNRISE', 'MIDNIGHT', 'LATE NIGHT'],
            locationHints: {
                'BEACH': ['DAY', 'SUNSET', 'SUNRISE'],
                'OFFICE': ['MORNING', 'AFTERNOON'],
                'HOME': ['EVENING', 'NIGHT'],
                'CITY': ['DAY', 'NIGHT'],
                'FOREST': ['DAWN', 'DUSK']
            }
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

        // Enhanced Context Detection Regex
        this.CONTEXT_REGEX = {
            SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+(?:\s*-\s*(DAY|NIGHT|MORNING|EVENING|LATE NIGHT|SUNSET|SUNRISE))?/i,
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

    // Enhanced Scene Heading Normalization
    normalizeSceneHeading(line) {
        const trimmedLine = line.trim();
        const matchingPrefix = this.SCENE_HEADING_PREFIXES.find(prefix => 
            trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
        );

        if (matchingPrefix) {
            const uppercasePrefix = matchingPrefix.toUpperCase();
            const locationPart = trimmedLine.slice(matchingPrefix.length).trim();
            
            // Split location into base and time of day
            const timeOfDayMatch = this.TIME_OF_DAY_OPTIONS.standard.find(time => 
                locationPart.toUpperCase().includes(time)
            );

            const baseLocation = timeOfDayMatch 
                ? locationPart.replace(new RegExp(timeOfDayMatch, 'i'), '').trim()
                : locationPart;

            const normalizedLocation = baseLocation
                .split(/\s+/)
                .map(word => word.toUpperCase())
                .join(' ');

            return timeOfDayMatch 
                ? `${uppercasePrefix} ${normalizedLocation} - ${timeOfDayMatch}`
                : `${uppercasePrefix} ${normalizedLocation}`;
        }

        return trimmedLine.toUpperCase();
    }

    // Comprehensive Context Detection
    detectContext(line) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) return 'ACTION';

        const cachedContext = this.cache.get(trimmedLine);
        if (cachedContext) return cachedContext;

        const hasSceneHeadingPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
            trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
        );

        let context = 'ACTION';
        
        if (hasSceneHeadingPrefix) {
            if (this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine)) {
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

        this.cache.set(trimmedLine, context);
        return context;
    }

    // Enhanced Line Formatting
    formatLine(line) {
        try {
            const trimmedLine = line.trim();
            const context = this.detectContext(trimmedLine);

            switch(context) {
                case 'SCENE_HEADING':
                    return this.normalizeSceneHeading(trimmedLine);

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

    // Spacebar Handling with Advanced Formatting
    handleSpacebar(line, cursorPosition) {
        const context = this.detectContext(line);
        const indent = this.cursorConfig.sectionIndents[context] || 0;

        let newPosition = cursorPosition;

        switch(context) {
            case 'SCENE_HEADING':
                const hasPrefix = this.SCENE_HEADING_PREFIXES.some(prefix => 
                    line.toUpperCase().trim().startsWith(prefix.toUpperCase())
                );
                
                if (hasPrefix) {
                    newPosition = Math.min(cursorPosition + 1, line.length);
                    const formattedLine = this.formatLine(line);
                    return {
                        content: formattedLine,
                        newCursorPosition: newPosition
                    };
                }
                break;

            case 'CHARACTER_NAME':
            case 'PARENTHETICAL':
            case 'DIALOGUE':
            case 'TRANSITION':
                newPosition = Math.max(cursorPosition, indent);
                break;

            default:
                newPosition = Math.min(cursorPosition + 1, line.length);
                break;
        }

        return {
            content: line,
            newCursorPosition: newPosition
        };
    }

    // Existing methods for tab, enter, and reset
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

    reset() {
        this.cache.clear();
        this.state.currentSection = 'SCENE_HEADING';
        this.state.currentCharacter = null;
    }
}
