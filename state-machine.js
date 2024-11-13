(function(window) {
    class Cache {
        constructor(maxSize, evictionStrategy = 'lru') {
            this.maxSize = maxSize;
            this.strategy = evictionStrategy;
            this.cache = new Map();
            this.accessOrder = [];
            this.frequency = new Map();
        }

        get(key) {
            if (this.cache.has(key)) {
                this._updateAccessOrder(key);
                return this.cache.get(key);
            }
            return null;
        }

        set(key, value) {
            if (this.cache.size >= this.maxSize) {
                this._evict();
            }
            this.cache.set(key, value);
            this._updateAccessOrder(key);
            this.frequency.set(key, (this.frequency.get(key) || 0) + 1);
        }

        _updateAccessOrder(key) {
            const index = this.accessOrder.indexOf(key);
            if (index !== -1) {
                this.accessOrder.splice(index, 1);
            }
            this.accessOrder.push(key);
        }

        _evict() {
            if (this.strategy === 'lru') {
                const oldestKey = this.accessOrder.shift();
                this.cache.delete(oldestKey);
                this.frequency.delete(oldestKey);
            } else if (this.strategy === 'lfu') {
                const leastFrequent = Array.from(this.frequency.entries()).reduce((a, b) => a[1] < b[1] ? a : b)[0];
                this.cache.delete(leastFrequent);
                this.frequency.delete(leastFrequent);
            }
        }
    }

    class CharacterTracker {
        constructor(maxNames) {
            this.maxNames = maxNames;
            this.names = new Map();
            this.variations = new Map();
        }

        track(characterName) {
            const normalizedName = characterName.toUpperCase().trim();
            const currentCount = this.names.get(normalizedName) || 0;
            this.names.set(normalizedName, currentCount + 1);

            const nameParts = normalizedName.split(' ');
            nameParts.forEach(part => {
                const variations = this.variations.get(part) || new Set();
                variations.add(normalizedName);
                this.variations.set(part, variations);
            });

            if (this.names.size > this.maxNames) {
                const sortedNames = Array.from(this.names.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, this.maxNames);
                this.names = new Map(sortedNames);
            }
        }

        getSuggestions(partialName) {
            const normalizedPartial = partialName.toUpperCase().trim();
            const directMatches = Array.from(this.names.keys())
                .filter(name => name.includes(normalizedPartial))
                .slice(0, 5);

            const variationMatches = Array.from(this.variations.entries())
                .filter(([part]) => part.includes(normalizedPartial))
                .flatMap(([, names]) => Array.from(names))
                .slice(0, 5);

            return [...new Set([...directMatches, ...variationMatches])];
        }
    }

    class SceneTracker {
        constructor(maxLocations, maxFrequentHeadings) {
            this.maxLocations = maxLocations;
            this.maxFrequentHeadings = maxFrequentHeadings;
            this.locations = new Map();
            this.frequentHeadings = new Map();
        }

        trackLocation(location) {
            const normalizedLocation = location.toUpperCase();
            const currentCount = this.locations.get(normalizedLocation) || 0;
            this.locations.set(normalizedLocation, currentCount + 1);

            if (this.locations.size > this.maxLocations) {
                const sortedLocations = Array.from(this.locations.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, this.maxLocations);
                this.locations = new Map(sortedLocations);
            }

            this.updateFrequentHeadings(normalizedLocation);
        }

        updateFrequentHeadings(heading) {
            const count = (this.frequentHeadings.get(heading) || 0) + 1;
            this.frequentHeadings.set(heading, count);

            const sortedHeadings = Array.from(this.frequentHeadings.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, this.maxFrequentHeadings);

            this.frequentHeadings = new Map(sortedHeadings);
        }

        getFrequentHeadingSuggestions(partialHeading) {
            return Array.from(this.frequentHeadings.keys())
                .filter(heading => heading.toLowerCase().includes(partialHeading.toLowerCase()))
                .slice(0, 5);
        }
    }

    class ScreenplayStateMachine {
        constructor(options = {}) {
            this.config = {
                maxCacheSize: options.maxCacheSize || 1000,
                maxFrequentHeadings: options.maxFrequentHeadings || 10,
                maxCharacterNames: options.maxCharacterNames || 50,
                maxSceneLocations: options.maxSceneLocations || 50,
                cacheEvictionStrategy: options.cacheEvictionStrategy || 'lru'
            };

            this.cache = new Cache(this.config.maxCacheSize, this.config.cacheEvictionStrategy);
            this.characterTracker = new CharacterTracker(this.config.maxCharacterNames);
            this.sceneTracker = new SceneTracker(this.config.maxSceneLocations, this.config.maxFrequentHeadings);

            this.CONTEXT_REGEX = {
                SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+/i,
                CHARACTER_NAME: /^[A-Z][A-Z\s]+$/,
                TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i
            };

            this.SCENE_HEADING_PREFIXES = Object.freeze([
                'INT.', 'EXT.', 'EST.', 'INT/EXT.', 'I/E.',
                'int.', 'ext.', 'est.', 'int/ext.', 'i/e.'
            ]);

            this.DROPDOWN_OPTIONS = Object.freeze({
                TIME_OF_DAY: ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING'],
                TRANSITIONS: ['CUT TO:', 'FADE IN:', 'FADE OUT:', 'DISSOLVE TO:', 'SMASH CUT TO:']
            });

            this.FORMATTING_RULES = {
                SCENE_HEADING: {
                    pattern: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)\s*[A-Z0-9\s]+(-\s*(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING))?$/i,
                    suggestions: 'Use format: INT./EXT. LOCATION - TIME OF DAY',
                    margins: {
                        top: 1,
                        bottom: 1,
                        left: 0,
                        right: 0
                    }
                },
                ACTION: {
                    pattern: /^[A-Za-z0-9\s]+$/,
                    suggestions: 'Describe the scene or action',
                    margins: {
                        top: 0,
                        bottom: 1,
                        left: 0,
                        right: 0
                    }
                },
                CHARACTER_NAME: {
                    pattern: /^[A-Z\s]+$/,
                    suggestions: 'Character names should be in ALL CAPS',
                    margins: {
                        top: 1,
                        bottom: 0,
                        left: 'center',
                        right: 'center'
                    }
                },
                DIALOGUE: {
                    pattern: /^(\s{4})[A-Za-z]/,
                    suggestions: 'Dialogue should be indented with 4 spaces',
                    margins: {
                        top: 0,
                        bottom: 1,
                        left: 4,
                        right: 4
                    }
                },
                PARENTHETICAL: {
                    pattern: /^\s*\([^)]+\)$/,
                    suggestions: 'Add character emotions or tone in parentheses',
                    margins: {
                        top: 0,
                        bottom: 0,
                        left: 4,
                        right: 4
                    }
                },
                TRANSITION: {
                    pattern: /^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:|SMASH CUT TO:)$/i,
                    suggestions: 'Use standard screenplay transitions',
                    margins: {
                        top: 1,
                        bottom: 1,
                        left: 'right',
                        right: 0
                    }
                }
            };
        }

        // Enhanced formatting method
        formatLine(line) {
            const trimmedLine = line.trim();
            const context = this.detectContext(trimmedLine);

            switch(context) {
                case 'SCENE_HEADING':
                    // Existing scene heading formatting
                    const sceneHeadingPrefixes = this.SCENE_HEADING_PREFIXES;
                    const matchingPrefix = sceneHeadingPrefixes.find(prefix => 
                        trimmedLine.toUpperCase().startsWith(prefix.toUpperCase())
                    );

                    if (matchingPrefix) {
                        const uppercasePrefix = matchingPrefix.toUpperCase();
                        const locationPart = trimmedLine.slice(matchingPrefix.length).trim();
                        const uppercaseLocation = locationPart.toUpperCase();
                        return `${uppercasePrefix} ${uppercaseLocation}`;
                    }
                    return trimmedLine.toUpperCase();

                case 'CHARACTER_NAME':
                    // Ensure character names are centered and in ALL CAPS
                    return trimmedLine.toUpperCase().padStart(40, ' ').padEnd(80, ' ');

                case 'DIALOGUE':
                    // Indent dialogue with 4 spaces
                    return '    ' + trimmedLine;

                case 'PARENTHETICAL':
                    // Indent parentheticals with 4 spaces
                    return '    ' + trimmedLine;

                case 'TRANSITION':
                    // Right-align transitions
                    return trimmedLine.toUpperCase().padStart(80);

                case 'ACTION':
                    // Capitalize first letter of action lines
                    return trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1);

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
            }

            this.cache.set(trimmedLine, context);
            return context;
        }

        updateCharacterAndSceneTracking(lines) {
            lines.forEach(line => {
                const context = this.detectContext(line.trim());
                if (context === 'CHARACTER_NAME') {
                    this.characterTracker.track(line.trim());
                }
                if (context === 'SCENE_HEADING') {
                    this.sceneTracker.trackLocation(line.trim());
                }
            });
        }

        getCharacterSuggestions(partialName) {
            return this.characterTracker.getSuggestions(partialName);
        }

        getFrequentSceneHeadingSuggestions(partialHeading) {
            return this.sceneTracker.getFrequentHeadingSuggestions(partialHeading);
        }

        reset() {
            this.cache = new Cache(this.config.maxCacheSize, this.config.cacheEvictionStrategy);
            this.characterTracker = new CharacterTracker(this.config.maxCharacterNames);
            this.sceneTracker = new SceneTracker(this.config.maxSceneLocations, this.config.maxFrequentHeadings);
            this.state.currentSection = 'SCENE_HEADING';
            this.state.currentCharacter = null;
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

        handleTab() {
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
    }

    window.ScreenplayStateMachine = ScreenplayStateMachine;
})(window);
