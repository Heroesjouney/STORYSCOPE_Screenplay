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

        // Preserve transition rules and valid transitions
        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null,
            transitionRules: {
                'SCENE_HEADING': ['ACTION'],
                'ACTION': ['CHARACTER_NAME', 'SCENE_HEADING'],
                'CHARACTER_NAME': ['PARENTHETICAL', 'SCENE_HEADING'],
                'PARENTHETICAL': ['DIALOGUE'],
                'DIALOGUE': ['SCENE_HEADING', 'CHARACTER_NAME']
            },
            validTransitions: {
                'SCENE_HEADING': {
                    allowedContexts: ['SCENE_HEADING', 'ACTION'],
                    nextSection: 'ACTION'
                },
                'ACTION': {
                    allowedContexts: ['CHARACTER_NAME', 'SCENE_HEADING'],
                    nextSection: 'CHARACTER_NAME'
                },
                'CHARACTER_NAME': {
                    allowedContexts: ['PARENTHETICAL', 'SCENE_HEADING'],
                    nextSection: 'PARENTHETICAL'
                },
                'PARENTHETICAL': {
                    allowedContexts: ['DIALOGUE'],
                    nextSection: 'DIALOGUE'
                },
                'DIALOGUE': {
                    allowedContexts: ['SCENE_HEADING', 'CHARACTER_NAME'],
                    nextSection: 'SCENE_HEADING'
                }
            }
        };

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

        // Cursor tracking properties
        this.cursorTracking = {
            lastContext: null,
            lastLineLength: 0,
            lastCursorPosition: 0,
            contextStability: new Map(),
            positionHistory: []
        };
    }

    // Existing methods remain the same...
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

    // Enhanced state transition method
    transitionState(context, line) {
        const currentSection = this.state.currentSection;
        const validTransition = this.state.validTransitions[currentSection];

        // Check if context is allowed for current section
        if (validTransition.allowedContexts.includes(context)) {
            this.state.currentSection = validTransition.nextSection;
            return true;
        }

        return false;
    }

    // Rest of the methods remain the same...
    handleEnter(line) {
        const trimmedLine = line.trim();
        const context = this.detectContext(trimmedLine);

        // Use state transition method
        const transitionSuccessful = this.transitionState(context, trimmedLine);

        if (!transitionSuccessful) {
            // Fallback to default state if transition fails
            this.state.currentSection = 'SCENE_HEADING';
        }

        // Optional: track character for character-related sections
        if (context === 'CHARACTER_NAME') {
            this.state.currentCharacter = trimmedLine;
        }
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
            recommendedLineLength: this.cursorConfig.recommendedLineLength[this.state.currentSection] || 60
        };
    }

    // Existing tracking methods remain the same...
    updateCharacterAndSceneTracking(lines) {
        lines.forEach(line => {
            const context = this.detectContext(line.trim());
            if (context === 'CHARACTER_NAME') {
                this.trackCharacter(line.trim());
            }
            if (context === 'SCENE_HEADING') {
                this.trackScene(line.trim());
            }
        });
    }

    trackCharacter(characterName) {
        const normalizedName = characterName.toUpperCase().trim();
        const currentCount = this.characters.get(normalizedName) || 0;
        this.characters.set(normalizedName, currentCount + 1);

        const nameParts = normalizedName.split(' ');
        nameParts.forEach(part => {
            const variations = this.characterVariations.get(part) || new Set();
            variations.add(normalizedName);
            this.characterVariations.set(part, variations);
        });

        this._trimTrackedItems(this.characters, this.config.maxCharacterNames);
    }

    trackScene(location) {
        const normalizedLocation = location.toUpperCase().trim();
        const currentCount = this.scenes.get(normalizedLocation) || 0;
        this.scenes.set(normalizedLocation, currentCount + 1);

        const headingCount = (this.sceneHeadings.get(normalizedLocation) || 0) + 1;
        this.sceneHeadings.set(normalizedLocation, headingCount);

        this._trimTrackedItems(this.scenes, this.config.maxSceneLocations);
        this._trimTrackedItems(this.sceneHeadings, this.config.maxFrequentHeadings);
    }

    _trimTrackedItems(map, maxSize) {
        if (map.size > maxSize) {
            const sortedEntries = Array.from(map.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, maxSize);
            map.clear();
            sortedEntries.forEach(([key, value]) => map.set(key, value));
        }
    }

    // Existing suggestion methods remain the same...
    getCharacterSuggestions(partialName) {
        const normalizedPartial = partialName.toUpperCase().trim();
        const directMatches = Array.from(this.characters.keys())
            .filter(name => name.includes(normalizedPartial))
            .slice(0, 5);

        const variationMatches = Array.from(this.characterVariations.entries())
            .filter(([part]) => part.includes(normalizedPartial))
            .flatMap(([, names]) => Array.from(names))
            .slice(0, 5);

        return [...new Set([...directMatches, ...variationMatches])];
    }

    getFrequentSceneHeadingSuggestions(partialHeading) {
        return Array.from(this.sceneHeadings.keys())
            .filter(heading => heading.toLowerCase().includes(partialHeading.toLowerCase()))
            .slice(0, 5);
    }

    reset() {
        this.cache.clear();
        this.characters.clear();
        this.scenes.clear();
        this.characterVariations.clear();
        this.sceneHeadings.clear();
        
        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null,
            transitionRules: this.state.transitionRules,
            validTransitions: this.state.validTransitions
        };
    }
}
