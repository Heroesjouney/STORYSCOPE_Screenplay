(function(window) {
    class ContextDetector {
        constructor() {
            // Screenplay Formatting Constants
            this.FORMATTING_SPECS = {
                MARGINS: {
                    LEFT: 1.5,   // inches
                    RIGHT: 1,    // inches
                    TOP: 1,      // inches
                    BOTTOM: 1    // inches
                },
                FONT: {
                    TYPE: 'Courier',
                    SIZE: 12,    // points
                    STYLE: 'regular'
                },
                SPACING: {
                    GENERAL: 'single',
                    DIALOGUE: 'single',
                    ACTION_PARAGRAPH: 'double',
                    CHARACTER_NAME_TOP_MARGIN: 1.5 // inches
                }
            };

            this.CONTEXT_REGEX = {
                SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+/i,
                CHARACTER_NAME: /^[A-Z][A-Z\s]+$/,
                TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i
            };

            this.SCENE_HEADING_PREFIXES = Object.freeze([
                'INT.', 'EXT.', 'EST.', 'INT/EXT.', 'I/E.',
                'int.', 'ext.', 'est.', 'int/ext.', 'i/e.'
            ]);
        }

        detectContext(line) {
            const trimmedLine = line.trim();

            let context = 'ACTION';
            
            if (this.CONTEXT_REGEX.SCENE_HEADING.test(trimmedLine)) {
                context = 'SCENE_HEADING';
            } else if (this.CONTEXT_REGEX.CHARACTER_NAME.test(trimmedLine)) {
                context = 'CHARACTER_NAME';
            } else if (this.CONTEXT_REGEX.TRANSITION.test(trimmedLine)) {
                context = 'TRANSITION';
            }

            return context;
        }

        formatLine(line) {
            const trimmedLine = line.trim();
            const context = this.detectContext(trimmedLine);

            switch(context) {
                case 'SCENE_HEADING':
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
                    // Centered, ALL CAPS
                    return trimmedLine.toUpperCase().padStart(40, ' ').padEnd(80, ' ');

                case 'DIALOGUE':
                    // Centered, 2.5 inches from left and right margins
                    return trimmedLine.padStart(30, ' ').padEnd(60, ' ');

                case 'PARENTHETICAL':
                    // Indented, within dialogue block
                    return `(${trimmedLine})`;

                case 'TRANSITION':
                    // Right-aligned, ALL CAPS
                    return trimmedLine.toUpperCase().padStart(80);

                case 'ACTION':
                    // First letter capitalized, present tense
                    return trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1);

                default:
                    return trimmedLine;
            }
        }

        getFormattingRules() {
            return {
                SCENE_HEADING: {
                    description: 'Describes location and time of day',
                    format: 'INT./EXT. LOCATION - TIME OF DAY',
                    capitalization: 'ALL UPPERCASE'
                },
                CHARACTER_NAME: {
                    description: 'Character speaking',
                    placement: 'Centered',
                    capitalization: 'ALL UPPERCASE'
                },
                DIALOGUE: {
                    description: 'Character\'s spoken words',
                    margins: '2.5 inches from left and right',
                    spacing: 'Single-spaced'
                },
                ACTION: {
                    description: 'Scene description',
                    tense: 'Present',
                    spacing: 'Single-spaced, double space between paragraphs'
                }
            };
        }
    }

    // Expose to global window object
    window.ContextDetector = ContextDetector;
})(window);
