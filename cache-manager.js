class CacheManager {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100;
        this.ttl = options.ttl || null;
        this.cache = new Map();
        this.accessOrder = [];
    }

    set(key, value, ttl = this.ttl) {
        if (this.cache.size >= this.maxSize) {
            this._evict();
        }
        const entry = {
            value,
            timestamp: Date.now(),
            ttl
        };
        this.cache.set(key, entry);
        this._updateAccessOrder(key);
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (this.ttl && (Date.now() - entry.timestamp > this.ttl)) {
            this.cache.delete(key);
            return null;
        }

        this._updateAccessOrder(key);
        return entry.value;
    }

    _updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    _evict() {
        const oldestKey = this.accessOrder.shift();
        this.cache.delete(oldestKey);
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    // Optional: Add method to get cache size
    size() {
        return this.cache.size;
    }
}

// Export for module compatibility
export default CacheManager;
