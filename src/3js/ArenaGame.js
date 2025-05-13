import { SceneManager } from './SceneManager.js';
import { ModelLoader } from './ModelManager.js';
import { InputController } from './InputController.js';
import { CharacterController } from './CharacterController.js';
import { AnimationStateController } from './AnimationStateController.js';
import { UIManager } from './UIManager.js';
import { DebugController } from './DebugController.js';
import { EnvironmentManager } from './EnvironmentManager.js';

export class ArenaGame {
  constructor(modelPath = './model.glb') {
    // Create scene manager
    this.sceneManager = new SceneManager();
    
    // Create model loader with a callback to update camera
    this.modelLoader = new ModelLoader(
      this.sceneManager.scene, 
    //   (center, size) => this.sceneManager.updateCameraForModel(center, size)
    );
    
    // Create environment manager
    this.environmentManager = new EnvironmentManager(this.sceneManager.scene);
    
    // Create controllers
    this.inputController = new InputController();
    this.uiManager = new UIManager();
    this.characterController = new CharacterController(this.modelLoader, this.inputController);
    this.animationStateController = new AnimationStateController(
      this.modelLoader, 
      this.characterController, 
      this.inputController
    );
    this.debugController = new DebugController(this.animationStateController, this.uiManager);
    
    // Initialize UI
    this.uiManager.setupInstructions();
    
    // Hide controls by default
    this.uiManager.hideControls();
    
    // Initialize debug controls
    this.debugController.setupDebugControls(this.inputController);
    
    // Extend the SceneManager's animate method to include model animations and camera following
    this.setupAnimationLoop();
    
    // Log animation data once loaded
    setTimeout(() => {
      this.animationStateController.checkAnimations();
    }, 2000); // Give time for model to load
    
    // Load any buildings in the assets folder (you can call this method separately if needed)
    this.loadBuildings();
  }
  
  // New method to load buildings
  loadBuildings() {
    // Path to buildings folder based on the provided screenshot
    const buildingsPath = './assets/models/buildings/';
    
    // List of building models from the screenshot
    const buildingModels = [
      'Arch.glb',
      'Bakery.glb',
      'Butcher.glb',
      'Coliseum.glb',
      'fishing_club.glb',
      'G_Angel_Altar.glb',
      'Gold_mine.glb',
      'Grape_Farm.glb',
      'Home.glb',
      'Iron_mide.glb',
      'Marble_Mine_1.glb',
      'Marketplace.glb',
      'Plane.glb',
      'small_hospital.glb',
      'Tavern.glb',
      'Templa_3.glb',
      'Templa.glb',
      'Theater.glb',
      'Town_Hall.glb',
      'Warehouse.glb',
      'WatchTower.glb',
      'Wheat_Farm.glb',
      'Woodcutter_house.glb'
    ];
    
    console.log('Loading building models from assets/models/buildings...');
    
    // Load each building model
    buildingModels.forEach(modelFileName => {
      const modelPath = `${buildingsPath}${modelFileName}`;
      // Use the filename without extension as the ID
      const modelId = modelFileName.replace('.glb', '');
      
      this.environmentManager.loadBuilding(modelId, modelPath, (model) => {
        console.log(`Building ${modelId} loaded successfully`);
      });
    });
    
    // Allow the user to manually position buildings
    console.log('You can position buildings using:');
    console.log('game.environmentManager.setPosition("BuildingName", x, y, z)');
    console.log('game.environmentManager.setRotation("BuildingName", x, y, z)');
    console.log('game.environmentManager.setScale("BuildingName", x, y, z)');
  }
  
  // Helper method to position a building
  positionBuilding(id, x, y, z) {
    return this.environmentManager.setPosition(id, x, y, z);
  }
  
  // Helper method to rotate a building
  rotateBuilding(id, x, y, z) {
    return this.environmentManager.setRotation(id, x, y, z);
  }
  
  // Helper method to scale a building
  scaleBuilding(id, x, y, z) {
    return this.environmentManager.setScale(id, x, y, z);
  }
  
  // Setup the animation loop
  setupAnimationLoop() {
    const originalAnimate = this.sceneManager.animate;
    this.sceneManager.animate = () => {
      requestAnimationFrame(this.sceneManager.animate.bind(this.sceneManager));
      
      // Get delta time for animation updates
      const delta = this.sceneManager.clock.getDelta();
      
      // Resolve key conflicts before processing inputs
      this.inputController.resolveKeyConflicts();
      
      // Handle camera alignment toggle
      this.handleCameraAlignmentToggle();
      
      // Handle controls visibility toggle
      this.handleControlsVisibilityToggle();
      
      // Update character animations - using the ModelLoader's animation manager
      this.modelLoader.updateAnimations(delta);
      
      // Check for 180-degree turn animation completion
      this.characterController.check180TurnCompletion();
      
      // Update character position based on keys (continuous movement)
      this.updateCharacterPosition();
      
      // Check for animation state changes (throttled internally)
      this.animationStateController.updateAnimation();
      
      // Always update follow camera
      this.updateCamera();
      
      // Render the scene
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    };
    
    // Start animation loop
    this.sceneManager.animate();
  }
  
  // Handle camera alignment toggle
  handleCameraAlignmentToggle() {
    if (this.inputController.keys.alignToggle) {
            // Toggle camera mode
      const isAligned = this.characterController.toggleCameraAlignment();
            
            // When switching modes, reset the camera offsets
            if (this.sceneManager && this.sceneManager.followCamera) {
              this.sceneManager.followCamera.resetAngles();
            }
            
      console.log(`Camera mode: ${isAligned ? 'FREE' : 'FOLLOWING PLAYER'}`);
            
            // Update instructions display
      this.uiManager.updateAlignmentStatus(isAligned);
      
      // Reset the toggle key to prevent continuous toggling
      this.inputController.keys.alignToggle = false;
    }
  }
  
  // Handle controls visibility toggle
  handleControlsVisibilityToggle() {
    if (this.inputController.keys.toggleControls) {
      // Toggle the visibility of controls
      const isVisible = this.uiManager.toggleControlsVisibility();
      console.log(`Controls visibility: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
      
      // Reset the toggle key to prevent continuous toggling
      this.inputController.keys.toggleControls = false;
    }
  }
  
  // Update character position
  updateCharacterPosition() {
        // Get camera's forward direction for movement when in FREE mode
        const cameraAngle = this.sceneManager.followCamera.horizontalAngle;
        
    // Update character position based on input
    this.characterController.updatePosition(cameraAngle);
  }
  
  // Update camera to follow character
  updateCamera() {
    const position = this.characterController.position;
    
    if (this.modelLoader.character && position) {
      // Update the follow camera with character position and rotation
      if (!this.characterController.shouldAlignWithCamera) {
        // Pass camera rotation when alignment is off so camera follows player rotation
        // Use getCameraRotation for smooth camera movement during animations
        const cameraRotation = this.characterController.getCameraRotation();
        this.sceneManager.followCamera.update(position, cameraRotation);
      } else {
        // When alignment is on, we don't need to pass rotation as the camera controls the rotation
        this.sceneManager.followCamera.update(position, 0);
      }
    }
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // You can specify a different model path
  const game = new ArenaGame('./your-model.glb');
  
  // Make the game available globally for debugging
  window.game = game;
  
  // Example of how to load and position buildings after initialization
  // This could be called from a UI button or another event
  // setTimeout(() => {
  //   game.environmentManager.loadBuilding('house1', './assets/models/house.glb', (model) => {
  //     game.environmentManager.setPosition('house1', 10, 0, 10);
  //     game.environmentManager.setScale('house1', 1, 1, 1);
  //   });
  // }, 3000);
});