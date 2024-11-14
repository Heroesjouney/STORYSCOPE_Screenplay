export class ScreenplayTracker {
    constructor(options = {}) {
        this.config = {
            maxCharacterNames: options.maxCharacterNames || 50,
            maxSceneLocations: options.maxSceneLocations || 50,
            maxFrequentHeadings: options.maxFrequentHeadings || 10
        };

        this.characters = new Map();
        this.scenes = new Map();
        this.characterVariations = new Map();
        this.sceneHeadings = new Map();
    }

    trackCharacter(characterName) {
        const normalizedName = characterName.toUpperCase().trim();
        const currentCount = this.characters.get(normalizedName) || 0;
        this.characters.set(normalizedName, currentCount + 1);

        // Track character name variations
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

        // Track scene heading frequencies
        const headingCount = (this.sceneHeadings.get(normalizedLocation) || 0) + 1;
        this.sceneHeadings.set(normalizedLocation, headingCount);

        this._trimTrackedItems(this.scenes, this.config.maxSceneLocations);
        this._trimTrackedItems(this.sceneHeadings, this.config.maxFrequentHeadings);
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

    getSceneSuggestions(partialHeading) {
        return Array.from(this.sceneHeadings.keys())
            .filter(heading => heading.toLowerCase().includes(partialHeading.toLowerCase()))
            .slice(0, 5);
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

    reset() {
        this.characters.clear();
        this.scenes.clear();
        this.characterVariations.clear();
        this.sceneHeadings.clear();
    }
}
