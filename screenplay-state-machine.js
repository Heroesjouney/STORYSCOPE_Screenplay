export default class ScreenplayStateMachine {
    constructor(options = {}) {
        // Existing constructor code remains the same
        
        // Enhanced spacebar tracking
        this._spacebarState = {
            lastSpacePosition: 0,
            spaceCount: 0,
            lastSpaceTimestamp: 0,
            spaceThreshold: 300, // milliseconds between spaces
            lineContext: null
        };
    }

    // Existing methods remain the same...

    // New method to handle spacebar input more intelligently
    handleSpaceBar(line, cursorPosition) {
        const currentTime = Date.now();
        const context = this.detectContext(line);

        // Reset space count if too much time has passed
        if (currentTime - this._spacebarState.lastSpaceTimestamp > this._spacebarState.spaceThreshold) {
            this._spacebarState.spaceCount = 0;
        }

        this._spacebarState.spaceCount++;
        this._spacebarState.lastSpacePosition = cursorPosition;
        this._spacebarState.lastSpaceTimestamp = currentTime;
        this._spacebarState.lineContext = context;

        // Special handling for different contexts
        switch(context) {
            case 'SCENE_HEADING':
                // Suggest time of day after two spaces
                if (this._spacebarState.spaceCount === 2 && !line.includes('-')) {
                    const timeOfDay = this.TIME_OF_DAY_OPTIONS[
                        Math.floor(Math.random() * this.TIME_OF_DAY_OPTIONS.length)
                    ];
                    return {
                        shouldModifyLine: true,
                        modifiedLine: `${line} - ${timeOfDay}`,
                        cursorPosition: line.length + 3
                    };
                }
                break;

            case 'CHARACTER_NAME':
                // Center character name more precisely
                if (this._spacebarState.spaceCount === 2) {
                    const centeredName = line.trim().padStart(40, ' ').padEnd(80, ' ');
                    return {
                        shouldModifyLine: true,
                        modifiedLine: centeredName,
                        cursorPosition: 40
                    };
                }
                break;
        }

        // Default behavior
        return {
            shouldModifyLine: false,
            modifiedLine: line,
            cursorPosition: cursorPosition
        };
    }

    // Enhanced context detection to support more nuanced space handling
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

    // Existing methods remain the same...
    formatLine(line) {
        // Existing formatLine implementation
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

    // Existing methods remain the same...
    handleEnter(line) {
        const trimmedLine = line.trim();
        const context = this.detectContext(trimmedLine);

        // Use new state transition method
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
        super.reset(); // Call existing reset method
        this._spacebarState = {
            lastSpacePosition: 0,
            spaceCount: 0,
            lastSpaceTimestamp: 0,
            spaceThreshold: 300,
            lineContext: null
        };
    }
}
