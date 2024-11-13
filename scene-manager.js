import StateMachine from './screenplay-state-machine.js';
import { debugLog } from './utils.js';

export default class SceneManager {
    constructor(stateMachine) {
        this.stateMachine = stateMachine || new StateMachine();
        this.sceneListElement = document.getElementById('scene-list');
        this.scenes = [];
        this.lastContent = '';
        this.draggedScene = null;

        // Ensure scene list is set up for drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        if (!this.sceneListElement) return;

        // Enable drag and drop on the scene list container
        this.sceneListElement.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.sceneListElement.addEventListener('dragover', this.handleDragOver.bind(this));
        this.sceneListElement.addEventListener('drop', this.handleDrop.bind(this));
        this.sceneListElement.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    handleDragStart(event) {
        // Find the closest scene card
        const sceneCard = event.target.closest('.scene-card');
        if (!sceneCard) return;

        // Store the dragged scene's index
        this.draggedScene = {
            element: sceneCard,
            index: parseInt(sceneCard.dataset.sceneIndex, 10)
        };

        // Set drag effect and add a visual cue
        event.dataTransfer.setData('text/plain', ''); // Required for Firefox
        event.dataTransfer.effectAllowed = 'move';
        sceneCard.classList.add('dragging');
    }

    handleDragOver(event) {
        event.preventDefault(); // Allow dropping
        event.dataTransfer.dropEffect = 'move';
    }

    handleDrop(event) {
        event.preventDefault();
        
        // Find the target scene card
        const targetCard = event.target.closest('.scene-card');
        if (!this.draggedScene || !targetCard) return;

        const targetIndex = parseInt(targetCard.dataset.sceneIndex, 10);

        // Reorder scenes
        const [removedScene] = this.scenes.splice(this.draggedScene.index, 1);
        this.scenes.splice(targetIndex, 0, removedScene);

        // Rerender the scene list to reflect new order
        this.renderSceneList();

        // Log the reordering
        debugLog(`Scene moved from index ${this.draggedScene.index} to ${targetIndex}`, 'info');
    }

    handleDragEnd(event) {
        // Remove dragging visual cue
        const sceneCard = event.target.closest('.scene-card');
        if (sceneCard) {
            sceneCard.classList.remove('dragging');
        }
        this.draggedScene = null;
    }

    updateSceneList(lines) {
        try {
            // Convert lines to string for comparison
            const content = lines.join('\n');
            
            // Only update if content has changed
            if (this.lastContent !== content) {
                this.lastContent = content;
                this.scenes = this.extractScenes(lines);
                this.renderSceneList();
                debugLog(`Scene list updated: ${this.scenes.length} scenes found`);
            }
        } catch (error) {
            debugLog(`Scene list update error: ${error.message}`, 'error');
        }
    }

    extractScenes(lines) {
        const scenes = [];
        let currentScene = null;

        // Only process if we have lines
        if (!lines || !lines.length) return scenes;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return; // Skip empty lines
            
            const context = this.stateMachine.detectContext(trimmedLine);
            
            if (context === 'SCENE_HEADING') {
                if (currentScene) {
                    scenes.push(currentScene);
                }
                currentScene = {
                    heading: trimmedLine,
                    startLine: index,
                    content: [line]
                };
            } else if (currentScene) {
                currentScene.content.push(line);
            }
        });

        if (currentScene) {
            scenes.push(currentScene);
        }

        return scenes;
    }

    renderSceneList() {
        if (!this.sceneListElement) {
            debugLog('Scene list element not found', 'warn');
            return;
        }

        // Clear existing content
        this.sceneListElement.innerHTML = '';
        
        this.scenes.forEach((scene, index) => {
            const sceneCard = document.createElement('div');
            sceneCard.classList.add('scene-card');
            sceneCard.textContent = scene.heading;
            sceneCard.dataset.sceneIndex = index;

            // Enable dragging
            sceneCard.setAttribute('draggable', 'true');

            sceneCard.addEventListener('click', () => this.navigateToScene(index));
            
            this.sceneListElement.appendChild(sceneCard);
        });

        // Add a title or message if no scenes are found
        if (this.scenes.length === 0) {
            const noScenesMessage = document.createElement('div');
            noScenesMessage.textContent = 'No scenes detected';
            noScenesMessage.classList.add('no-scenes-message');
            this.sceneListElement.appendChild(noScenesMessage);
        }
    }

    navigateToScene(index) {
        const scene = this.scenes[index];
        if (!scene) return;

        const editorElement = document.getElementById('screenplay-editor');
        if (!editorElement) return;

        const lines = editorElement.value.split('\n');
        const position = lines.slice(0, scene.startLine).join('\n').length;
        
        editorElement.focus();
        editorElement.setSelectionRange(position, position);
        
        // Ensure the scene is visible
        editorElement.scrollTop = Math.max(0, position - 100);
    }

    getScenes() {
        return this.scenes;
    }
}
