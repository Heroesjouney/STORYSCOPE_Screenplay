import StateMachine from './screenplay-state-machine.js';

export default class SceneManager {
    constructor(stateMachine) {
        this.stateMachine = stateMachine || new StateMachine();
        this.sceneListElement = document.getElementById('scene-list');
        this.scenes = [];
        this.lastContent = '';
        window.utils.debugLog('Scene Manager initialized');
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
                window.utils.debugLog(`Scene list updated: ${this.scenes.length} scenes found`);
            }
        } catch (error) {
            window.utils.debugLog(`Scene list update error: ${error.message}`, 'error');
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
        if (!this.sceneListElement) return;

        // Only update if there are changes
        const newSceneList = document.createElement('div');
        
        this.scenes.forEach((scene, index) => {
            const sceneCard = document.createElement('div');
            sceneCard.classList.add('scene-card');
            sceneCard.textContent = scene.heading;
            sceneCard.dataset.sceneIndex = index;

            sceneCard.addEventListener('click', () => this.navigateToScene(index));
            
            newSceneList.appendChild(sceneCard);
        });

        // Only update DOM if content has changed
        if (this.sceneListElement.innerHTML !== newSceneList.innerHTML) {
            this.sceneListElement.innerHTML = newSceneList.innerHTML;
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
