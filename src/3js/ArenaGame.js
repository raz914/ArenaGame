import { SceneManager } from './SceneManager.js';
import { ModelLoader } from './ModelManager.js';

export class ArenaGame {
  constructor(modelPath = './model.glb') {
    // Create scene manager
    this.sceneManager = new SceneManager();
    
    // Create model loader with a callback to update camera
    this.modelLoader = new ModelLoader(
      this.sceneManager.scene, 
    //   (center, size) => this.sceneManager.updateCameraForModel(center, size)
    );
    
    // If a specific model path was provided, set it
    // if (modelPath !== './model.glb') {
    //   this.modelLoader.setModelPath(modelPath);
    // }
    
    // Extend the SceneManager's animate method to include model animations
    const originalAnimate = this.sceneManager.animate;
    this.sceneManager.animate = () => {
      requestAnimationFrame(this.sceneManager.animate.bind(this.sceneManager));
      
      // Update controls
      if (this.sceneManager.controls) {
        this.sceneManager.controls.update();
      }
      
      // Update animations
      if (this.modelLoader.mixer) {
        // const delta = this.sceneManager.clock.getDelta();
        // this.modelLoader.updateAnimations(delta);
      }
      
      // Render the scene
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    };
    
    // Start animation loop
    this.sceneManager.animate();
  }
  
  // Public method to change the model
//   loadModel(modelPath) {
//     this.modelLoader.setModelPath(modelPath);
//   }
}
// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // You can specify a different model path
    const game = new ArenaGame('./your-model.glb');
    
    // Make the game available globally for debugging
    window.game = game;
  }); 