(function(window) {
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
                .filter(heading => 
                    heading.toLowerCase().includes(partialHeading.toLowerCase())
                )
                .slice(0, 5);
        }

        clear() {
            this.locations.clear();
            this.frequentHeadings.clear();
        }

        getTopLocations(limit = 5) {
            return Array.from(this.locations.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([location]) => location);
        }
    }

    // Expose to global window object
    window.SceneTracker = SceneTracker;
})(window);
