(function(window) {
    class ScreenplayStateMachine {
        constructor(options = {}) {
            this.config = {
                maxCacheSize: options.maxCacheSize || 1000,
                maxFrequentHeadings: options.maxFrequentHeadings || 10,
                maxCharacterNames: options.maxCharacterNames || 50,
                maxSceneLocations: options.maxSceneLocations || 50,
                cacheEvictionStrategy: options.cacheEvictionStrategy || 'lru'
            };

            this.state = {
                currentSection: 'SCENE_HEADING',
                currentCharacter: null
            };

            this.CONTEXT_REGEX = {
                SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+/i,
                CHARACTER_NAME: /^[A-Z][A-Z\s]+$/,
                TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i
            };

            this.SCENE_HEADING_PREFIXES = [
                'INT.', 'EXT.', 'EST.', 'INT/EXT.', 'I/E.',
                'int.', 'ext.', 'est.', 'int/ext.', 'i/e.'
            ];

            this.FORMATTING_RULES = {
                SCENE_HEADING: {
                    pattern: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)\s*[A-Z0-9\s]+(-\s*(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING))?$/i,
                    margins: { top: 1, bottom: 1, left: 0, right: 0 }
                },
                ACTION: {
                    pattern: /^[A-Za-z0-9\s]+$/,
                    margins: { top: 0, bottom: 1, left: 0, right: 0 }
                },
                CHARACTER_NAME: {
                    pattern: /^[A-Z\s]+$/,
                    margins: { top: 1, bottom: 0, left: 'center', right: 'center' }
                },
                DIALOGUE: {
                    pattern: /^(\s{4})[A-Za-z]/,
                    margins: { top: 0, bottom: 1, left: 4, right: 4 }
                },
                PARENTHETICAL: {
                    pattern: /^\s*\([^)]+\)$/,
                    margins: { top: 0, bottom: 0, left: 4, right: 4 }
                },
                TRANSITION: {
                    pattern: /^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:|SMASH CUT TO:)$/i,
                    margins: { top: 1, bottom: 1, left: 'right', right: 0 }
                }
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

                case 'DIALOGUE':
                    return '    ' + trimmedLine;

                case 'PARENTHETICAL':
                    return '    ' + trimmedLine;

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
            
            if (this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine)) {
                return 'SCENE_HEADING';
            }
            if (this.CONTEXT_REGEX.CHARACTER_NAME.test(trimmedLine)) {
                return 'CHARACTER_NAME';
            }
            if (this.CONTEXT_REGEX.TRANSITION.test(trimmedLine)) {
                return 'TRANSITION';
            }
            
            return 'ACTION';
        }

        handleEnter(line) {
            const trimmedLine = line.trim();
            const context = this.detectContext(trimmedLine);

            switch (this.state.currentSection) {
                case 'SCENE_HEADING':
                    this.state.currentSection = context === 'SCENE_HEADING' ? 'ACTION' : 'SCENE_HEADING';
                    break;

                case 'ACTION':
                    this.state.currentSection = context === 'CHARACTER_NAME' ? 'CHARACTER_NAME' : 'SCENE_HEADING';
                    this.state.currentCharacter = context === 'CHARACTER_NAME' ? trimmedLine : null;
                    break;

                case 'CHARACTER_NAME':
                    this.state.currentSection = trimmedLine ? 'PARENTHETICAL' : 'SCENE_HEADING';
                    break;

                case 'PARENTHETICAL':
                    this.state.currentSection = 'DIALOGUE';
                    break;

                case 'DIALOGUE':
                    this.state.currentSection = trimmedLine ? 'DIALOGUE' : 'SCENE_HEADING';
                    break;

                default:
                    this.state.currentSection = 'SCENE_HEADING';
                    break;
            }
        }

        handleTab(reverse = false) {
            const sections = ['SCENE_HEADING', 'ACTION', 'CHARACTER_NAME', 'PARENTHETICAL', 'DIALOGUE'];
            const currentIndex = sections.indexOf(this.state.currentSection);
            
            if (reverse) {
                this.state.currentSection = sections[currentIndex > 0 ? currentIndex - 1 : sections.length - 1];
            } else {
                this.state.currentSection = sections[(currentIndex + 1) % sections.length];
            }
        }

        getCurrentMarginSection() {
            return this.state.currentSection;
        }

        applyMarginFormatting(line) {
            const rules = this.FORMATTING_RULES[this.state.currentSection];
            if (!rules) return line;

            let formattedLine = line;
            if (rules.margins.left === 'center') {
                formattedLine = formattedLine.padStart(40, ' ').padEnd(80, ' ');
            } else if (rules.margins.left === 'right') {
                formattedLine = formattedLine.padStart(80);
            } else if (rules.margins.left > 0) {
                formattedLine = ' '.repeat(rules.margins.left) + formattedLine;
            }

            return formattedLine;
        }

        reset() {
            this.state.currentSection = 'SCENE_HEADING';
            this.state.currentCharacter = null;
        }
    }

    // Expose to global scope
    window.ScreenplayStateMachine = ScreenplayStateMachine;
})(window);
