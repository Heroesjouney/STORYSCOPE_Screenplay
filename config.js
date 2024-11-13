class ConfigManager {
    static #instance = null;
    #config = {};

    constructor() {
        if (ConfigManager.#instance) {
            return ConfigManager.#instance;
        }
        ConfigManager.#instance = this;
        this.loadConfig();
    }

    loadConfig() {
        // Default configuration
        const defaultConfig = {
            export: {
                defaultFormat: 'pdf',
                availableFormats: ['pdf', 'txt', 'fdx']
            },
            editor: {
                autoSave: true,
                autoSaveInterval: 5000, // 5 seconds
                fontSize: 12,
                fontFamily: 'Courier New'
            },
            performance: {
                cacheSize: 100,
                cacheTTL: 3600000, // 1 hour
                debugMode: false
            },
            ui: {
                darkMode: false,
                distractionFreeMode: false
            }
        };

        // Merge with stored configuration
        this.#config = {
            ...defaultConfig,
            ...this._loadLocalConfig()
        };
    }

    _loadLocalConfig() {
        try {
            const storedConfig = localStorage.getItem('screenplayEditorConfig');
            return storedConfig ? JSON.parse(storedConfig) : {};
        } catch (error) {
            console.error('Error loading local config:', error);
            return {};
        }
    }

    get(key, defaultValue) {
        // Support nested key access
        return this._getNestedValue(this.#config, key) ?? defaultValue;
    }

    _getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => 
            acc && acc[part] !== undefined ? acc[part] : undefined, obj);
    }

    set(key, value) {
        // Support nested key setting
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((acc, part) => {
            if (!(part in acc)) acc[part] = {};
            return acc[part];
        }, this.#config);

        target[lastKey] = value;
        this._saveLocalConfig();
    }

    _saveLocalConfig() {
        try {
            localStorage.setItem('screenplayEditorConfig', JSON.stringify(this.#config));
        } catch (error) {
            console.error('Error saving local config:', error);
        }
    }

    reset() {
        // Reset to default configuration
        this.loadConfig();
        this._saveLocalConfig();
    }

    // Validate configuration
    validate() {
        const validationRules = {
            'export.defaultFormat': (val) => ['pdf', 'txt', 'fdx'].includes(val),
            'editor.fontSize': (val) => val > 8 && val < 32,
            'performance.cacheSize': (val) => val > 0 && val < 1000
        };

        const errors = [];
        for (const [path, validator] of Object.entries(validationRules)) {
            const value = this.get(path);
            if (!validator(value)) {
                errors.push(`Invalid configuration for ${path}: ${value}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Create a singleton instance
const config = new ConfigManager();

// Export for module compatibility
export default config;
