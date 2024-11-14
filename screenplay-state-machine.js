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
            TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i
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
                    return `${uppercasePrefix} ${uppercaseLocation}`;
                }
                return trimmedLine.toUpperCase();

            case 'CHARACTER_NAME':
                return trimmedLine.toUpperCase().padStart(40, ' ').padEnd(80, ' ');

            case 'TRANSITION':
                return trimmedLine.toUpperCase().padStart(80);

            case 'ACTION':
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
        this.cache.clear();
        this.characters.clear();
        this.scenes.clear();
        this.characterVariations.clear();
        this.sceneHeadings.clear();
        this.state = {
            currentSection: 'SCENE_HEADING',
            currentCharacter: null
        };
    }
}
