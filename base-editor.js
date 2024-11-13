(function(window) {
    class BaseEditor {
        constructor(editorElement) {
            console.log('BaseEditor: Initializing with editor element', editorElement);

            // Validate input with enhanced error handling
            if (!editorElement) {
                const errorMessage = 'No editor element provided';
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Ensure all methods exist before binding
            this.ensureMethodsExist();

            this.editor = editorElement;
            
            // Comprehensive method binding with error handling
            this.bindMethods();
            
            // Create UI elements
            this.dropdown = this.createDropdown();
            this.tooltip = this.createTooltip();
            
            // Setup event handling with comprehensive logging
            this.setupEventListeners();
            this.setupKeyboardShortcuts();

            // Debug logging
            console.log('BaseEditor fully initialized');
        }

        // Ensure all methods exist before binding
        ensureMethodsExist() {
            const requiredMethods = [
                'createDropdown', 
                'createTooltip', 
                'showDropdown', 
                'updateTooltip', 
                'handleInput', 
                'handleKeyDown', 
                'handleTabNavigation', 
                'handleEnterKey', 
                'handleSpecialKeys', 
                'setupKeyboardShortcuts', 
                'saveDocument',
                // Add missing method
                'findCurrentLineIndex'
            ];

            requiredMethods.forEach(methodName => {
                if (typeof this[methodName] !== 'function') {
                    this[methodName] = function() {
                        console.log(`Placeholder method: ${methodName}`);
                        // For findCurrentLineIndex, return a default implementation
                        if (methodName === 'findCurrentLineIndex') {
                            return function(lines, cursorPosition) {
                                let charCount = 0;
                                for (let i = 0; i < lines.length; i++) {
                                    charCount += lines[i].length + 1; // +1 for newline
                                    if (charCount > cursorPosition) {
                                        return i;
                                    }
                                }
                                return lines.length - 1;
                            };
                        }
                    };
                }
            });
        }

        // Centralized method binding with error handling
        bindMethods() {
            const methodsToBind = [
                'createDropdown', 
                'createTooltip', 
                'showDropdown', 
                'updateTooltip', 
                'handleInput', 
                'handleKeyDown', 
                'handleTabNavigation', 
                'handleEnterKey', 
                'handleSpecialKeys', 
                'setupKeyboardShortcuts', 
                'saveDocument',
                // Add missing method
                'findCurrentLineIndex'
            ];

            methodsToBind.forEach(methodName => {
                try {
                    if (typeof this[methodName] === 'function') {
                        this[methodName] = this[methodName].bind(this);
                    } else {
                        console.warn(`Method ${methodName} is not a function during binding`);
                    }
                } catch (error) {
                    console.error(`Error binding method ${methodName}:`, error);
                }
            });
        }

        createDropdown() {
            const dropdown = document.createElement('div');
            dropdown.id = 'editor-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                background-color: white;
                border: 1px solid #ccc;
                max-height: 200px;
                overflow-y: auto;
                display: none;
                z-index: 1000;
            `;
            document.body.appendChild(dropdown);
            return dropdown;
        }

        createTooltip() {
            const tooltip = document.createElement('div');
            tooltip.id = 'editor-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                padding: 5px;
                display: none;
                z-index: 1000;
            `;
            document.body.appendChild(tooltip);
            return tooltip;
        }

        setupEventListeners() {
            console.log('Setting up base editor event listeners');
            
            // Input event with comprehensive error handling
            this.editor.addEventListener('input', (event) => {
                try {
                    this.handleInput(event);
                } catch (error) {
                    console.error('Base editor input error:', error);
                    this.displayErrorTooltip(error.message);
                }
            });

            // Keydown event for special interactions
            this.editor.addEventListener('keydown', (event) => {
                try {
                    this.handleKeyDown(event);
                } catch (error) {
                    console.error('Base editor keydown error:', error);
                }
            });
        }

        // Placeholder methods with basic implementations
        handleInput(event) {
            console.log('Base editor input event', event);
        }

        handleKeyDown(event) {
            console.log('Base editor key down event', event.key);

            switch(event.key) {
                case 'Tab':
                    event.preventDefault();
                    this.handleTabNavigation(event.shiftKey);
                    break;

                case 'Enter':
                    this.handleEnterKey(event);
                    break;

                default:
                    this.handleSpecialKeys(event);
                    break;
            }
        }

        handleTabNavigation(isShiftPressed) {
            console.log('Base editor tab navigation', isShiftPressed);
        }

        handleEnterKey(event) {
            console.log('Base editor enter key', event);
        }

        handleSpecialKeys(event) {
            console.log('Base editor special key', event.key);
        }

        setupKeyboardShortcuts() {
            console.log('Base editor keyboard shortcuts setup');
            
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey || event.metaKey) {
                    switch(event.key) {
                        case 's':
                            event.preventDefault();
                            this.saveDocument();
                            break;
                    }
                }
            });
        }

        // Ensure findCurrentLineIndex is defined
        findCurrentLineIndex(lines, cursorPosition) {
            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                charCount += lines[i].length + 1; // +1 for newline
                if (charCount > cursorPosition) {
                    return i;
                }
            }
            return lines.length - 1;
        }

        // Placeholder save method
        saveDocument() {
            console.log('Saving document from base editor');
            // Actual save logic to be implemented in specialized editors
        }

        // New method for showing dropdown
        showDropdown(suggestions, selectionCallback) {
            console.log('Showing dropdown with suggestions:', suggestions);

            // Use existing dropdown element
            const dropdown = this.dropdown;
            
            // Clear previous content
            dropdown.innerHTML = '';

            // Populate dropdown with suggestions
            suggestions.forEach(suggestion => {
                const option = document.createElement('div');
                option.textContent = suggestion;
                option.classList.add('dropdown-option');
                option.addEventListener('click', () => {
                    selectionCallback(suggestion);
                    dropdown.style.display = 'none';
                });
                dropdown.appendChild(option);
            });

            // Position dropdown near editor
            const editorRect = this.editor.getBoundingClientRect();
            dropdown.style.top = `${editorRect.bottom + 5}px`;
            dropdown.style.left = `${editorRect.left}px`;
            dropdown.style.display = 'block';

            // Close dropdown when clicking outside
            const closeDropdown = (event) => {
                if (!dropdown.contains(event.target) && event.target !== this.editor) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeDropdown);
                }
            };
            document.addEventListener('click', closeDropdown);
        }
    }

    // Expose to global window object
    window.BaseEditor = BaseEditor;

    // Debugging log
    console.log('base-editor.js module loaded');
})(window);
