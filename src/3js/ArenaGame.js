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
    
    // Animation names catalog
    this.animations = {
      // Base states
      IDLE: "Armature.001|mixamo.com|Layer0.019",
      
      // Turning / Rotation
      TURN_LEFT_IDLE: "Armature.001|mixamo.com|Layer0.007",
      TURN_RIGHT_IDLE: "Armature.001|mixamo.com|Layer0.049",
      TURN_180_WALK: "Armature.001|mixamo.com|Layer0.029",
      
      // Running Directions
      RUN_FORWARD: "Armature.001|mixamo.com|Layer0.046",
      RUN_BACK: "Armature.001|mixamo.com|Layer0.021",
      STRAFE_LEFT_RUN: "Armature.001|mixamo.com|Layer0.011",
      STRAFE_RIGHT_RUN: "Armature.001|mixamo.com|Layer0.014",
      
      // Walking Directions
      WALK_FORWARD: "Armature.001|mixamo.com|Layer0.028",
      WALK_BACK: "Armature.001|mixamo.com|Layer0.013",
      STRAFE_RIGHT_WALK: "Armature.001|mixamo.com|Layer0.008",
      STRAFE_LEFT_WALK: "Armature.001|mixamo.com|Layer0.008"
    };
    
    // Character position and rotation
    this.characterPosition = {
      x: 0,
      y: 0,
      z: 0
    };
    
    this.characterRotation = 0; // In radians
    this.moveSpeed = 0.05; // Regular movement speed
    this.runSpeed = 0.15; // Run movement speed
    this.turnSpeed = 0.05; // Rotation speed
    
    // If a specific model path was provided, set it
    // if (modelPath !== './model.glb') {
    //   this.modelLoader.setModelPath(modelPath);
    // }
    
    // Add keyboard controls for character movement
    this.setupKeyboardControls();
    
    // Extend the SceneManager's animate method to include model animations
    const originalAnimate = this.sceneManager.animate;
    this.sceneManager.animate = () => {
      requestAnimationFrame(this.sceneManager.animate.bind(this.sceneManager));
      
      // Update controls
      if (this.sceneManager.controls) {
        this.sceneManager.controls.update();
      }
      
      // Update animations
      const delta = this.sceneManager.clock.getDelta();
      
      // Update character animations
      if (this.modelLoader.characterMixer) {
        this.modelLoader.characterMixer.update(delta);
      }
      
      // Update character position based on keys (continuous movement)
      this.updateCharacterPosition();
      
      // Render the scene
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    };
    
    // Start animation loop
    this.sceneManager.animate();
  }
  
  // Setup keyboard controls for character movement
  setupKeyboardControls() {
    // Create an object to track which keys are pressed
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      run: false,
      turnLeft: false,
      turnRight: false
    };
    
    // Add keydown event listener
    window.addEventListener('keydown', (event) => {
      // Update keys object based on key pressed
      switch(event.key.toLowerCase()) {
        case 'w':
          this.keys.forward = true;
          break;
        case 's':
          this.keys.backward = true;
          break;
        case 'a':
          this.keys.left = true;
          break;
        case 'd':
          this.keys.right = true;
          break;
        case 'shift':
          this.keys.run = true;
          break;
        case 'q':
          this.keys.turnLeft = true;
          break;
        case 'e':
          this.keys.turnRight = true;
          break;
      }
      
      // Handle character animation based on pressed keys
      this.updateCharacterAnimation();
    });
    
    // Add keyup event listener
    window.addEventListener('keyup', (event) => {
      // Update keys object based on key released
      switch(event.key.toLowerCase()) {
        case 'w':
          this.keys.forward = false;
          break;
        case 's':
          this.keys.backward = false;
          break;
        case 'a':
          this.keys.left = false;
          break;
        case 'd':
          this.keys.right = false;
          break;
        case 'shift':
          this.keys.run = false;
          break;
        case 'q':
          this.keys.turnLeft = false;
          break;
        case 'e':
          this.keys.turnRight = false;
          break;
      }
      
      // Handle character animation based on key state
      this.updateCharacterAnimation();
    });
  }
  
  // Update character animation based on keyboard input
  updateCharacterAnimation() {
    // Check if character is loaded
    if (this.modelLoader.character) {
      // Determine which animation to play based on key combinations
      
      // Turning animations
      if (this.keys.turnLeft) {
        this.modelLoader.playCharacterAnimation(this.animations.TURN_LEFT_IDLE);
        return;
      } 
      else if (this.keys.turnRight) {
        this.modelLoader.playCharacterAnimation(this.animations.TURN_RIGHT_IDLE);
        return;
      }
      
      // Forward/backward movement
      if (this.keys.forward) {
        // Running forward
        if (this.keys.run) {
          this.modelLoader.playCharacterAnimation(this.animations.RUN_FORWARD);
        } 
        // Walking forward
        else {
          this.modelLoader.playCharacterAnimation(this.animations.WALK_FORWARD);
        }
      }
      // Backward movement
      else if (this.keys.backward) {
        // Running backward
        if (this.keys.run) {
          this.modelLoader.playCharacterAnimation(this.animations.RUN_BACK);
        } 
        // Walking backward
        else {
          this.modelLoader.playCharacterAnimation(this.animations.WALK_BACK);
        }
      }
      // Strafing left
      else if (this.keys.left) {
        // Running left
        if (this.keys.run) {
          this.modelLoader.playCharacterAnimation(this.animations.STRAFE_LEFT_RUN);
        } 
        // Walking left
        else {
          this.modelLoader.playCharacterAnimation(this.animations.STRAFE_LEFT_WALK);
        }
      }
      // Strafing right
      else if (this.keys.right) {
        // Running right
        if (this.keys.run) {
          this.modelLoader.playCharacterAnimation(this.animations.STRAFE_RIGHT_RUN);
        } 
        // Walking right
        else {
          this.modelLoader.playCharacterAnimation(this.animations.STRAFE_RIGHT_WALK);
        }
      }
      // Idle (no movement keys pressed)
      else {
        this.modelLoader.playCharacterAnimation(this.animations.IDLE);
      }
    }
  }
  
  // Update character position based on keyboard input
  updateCharacterPosition() {
    if (this.modelLoader.character) {
      const speed = this.keys.run ? this.runSpeed : this.moveSpeed;
      
      // Handle rotation first (Q and E keys)
      if (this.keys.turnLeft) {
        this.characterRotation += this.turnSpeed;
        this.modelLoader.rotateCharacter(this.characterRotation);
      }
      else if (this.keys.turnRight) {
        this.characterRotation -= this.turnSpeed;
        this.modelLoader.rotateCharacter(this.characterRotation);
      }
      
      // Calculate movement based on character's facing direction
      let dx = 0;
      let dz = 0;
      
      // Forward/backward movement along character's facing direction
      if (this.keys.forward) {
        dx += Math.sin(this.characterRotation) * speed;
        dz += Math.cos(this.characterRotation) * speed;
      }
      else if (this.keys.backward) {
        dx -= Math.sin(this.characterRotation) * speed;
        dz -= Math.cos(this.characterRotation) * speed;
      }
      
      // Strafing perpendicular to facing direction
      if (this.keys.left) {
        dx -= Math.cos(this.characterRotation) * speed;
        dz += Math.sin(this.characterRotation) * speed;
      }
      else if (this.keys.right) {
        dx += Math.cos(this.characterRotation) * speed;
        dz -= Math.sin(this.characterRotation) * speed;
      }
      
      // Update position
      this.characterPosition.x += dx;
      this.characterPosition.z += dz;
      
      // Apply position to character model
      this.modelLoader.moveCharacter(this.characterPosition.x, this.characterPosition.z);
    }
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // You can specify a different model path
  const game = new ArenaGame('./your-model.glb');
  
  // Make the game available globally for debugging
  window.game = game;
});