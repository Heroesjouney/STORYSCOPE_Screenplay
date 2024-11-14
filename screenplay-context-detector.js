export class ScreenplayContextDetector {
    constructor() {
        this.CONTEXT_REGEX = {
            SCENE_HEADING: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)[\s\w-]+/i,
            CHARACTER_NAME: /^[A-Z][A-Z\s]+$/,
            TRANSITION: /^(FADE IN:|FADE OUT:|CUT TO:)/i
        };

        this.SCENE_HEADING_PREFIXES = Object.freeze([
            'INT.', 'EXT.', 'EST.', 'INT/EXT.', 'I/E.',
            'int.', 'ext.', 'est.', 'int/ext.', 'i/e.'
        ]);

        this.FORMATTING_RULES = {
            SCENE_HEADING: {
                pattern: /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)\s*[A-Z0-9\s]+(-\s*(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING))?$/i,
                suggestions: 'Use format: INT./EXT. LOCATION - TIME OF DAY',
                margins: { top: 1, bottom: 1, left: 0, right: 0 }
            },
            CHARACTER_NAME: {
                pattern: /^[A-Z\s]+$/,
                suggestions: 'Character names should be in ALL CAPS',
                margins: { top: 1, bottom: 0, left: 'center', right: 'center' }
            }
        };
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
}
