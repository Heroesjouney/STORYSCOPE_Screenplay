(function(window) {
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

        clear() {
            this.names.clear();
            this.variations.clear();
        }
    }

    // Expose to global window object
    window.CharacterTracker = CharacterTracker;
})(window);
