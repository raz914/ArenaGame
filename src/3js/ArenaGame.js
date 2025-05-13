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
    
    // Define animation state constants - use exact names as they appear in the AnimationManager
    this.ANIMATION_STATES = {
      IDLE: "IDLE",
      TURN_LEFT_IDLE: "TURN_LEFT_IDLE",
      TURN_RIGHT_IDLE: "TURN_RIGHT_IDLE",
      TURN_180_WALK: "TURN_180_WALK",
      RUN_FORWARD: "RUN_FORWARD",
      RUN_BACK: "RUN_BACK",
      STRAFE_LEFT_RUN: "STRAFE_LEFT_RUN",
      STRAFE_RIGHT_RUN: "STRAFE_RIGHT_RUN",
      WALK_FORWARD: "WALK_FORWARD",
      WALK_BACK: "WALK_BACK",
      STRAFE_LEFT_WALK: "STRAFE_LEFT_WALK",
      STRAFE_RIGHT_WALK: "STRAFE_RIGHT_WALK",
      JUMP: "JUMP",
      JUMP_1: "JUMP_1",
      VICTORY: "VICTORY",
      CROUCH: "CROUCH",
      CROUCH_IDLE: "CROUCH_IDLE"
    };
    
    // Character position and rotation
    this.characterPosition = {
      x: 0,
      y: 0.1, // Slightly above ground to prevent z-fighting
      z: 0
    };
    
    this.characterRotation = 0; // In radians
    this.moveSpeed = 0.035; // Regular movement speed
    this.runSpeed = 0.06; // Run movement speed
    this.turnSpeed = 0.02; // Rotation speed
    this.shouldAlignWithCamera = false; // Whether character should align with camera direction
    
    // Animation state tracking
    this.currentAnimationState = this.ANIMATION_STATES.IDLE;
    this.lastAnimationUpdateTime = 0;
    this.animationUpdateInterval = 100; // milliseconds between animation state evaluations
    
    // Turn animation cooldown flags
    this.turnLeftCooldown = false;
    this.turnRightCooldown = false;
    this.turn180Cooldown = false;
    
    // 180-degree turn animation tracking
    this.turn180Animation = false;
    this.turn180AnimationTime = 0;          // Track when animation started
    this.turn180AnimationDuration = 833;    // Duration in milliseconds (0.833 seconds from animation data)
    this.turn180RotationApplied = false;    // Flag to track if rotation has been applied
    
    // Jump animation tracking
    this.jumpAnimation = false;
    this.jumpAnimationTime = 0;
    this.jumpAnimationDuration = 1000;      // Default duration in milliseconds (1 second from animation data)
    this.jumpCooldown = false;
    this.jumpHeight = 0.5;                  // Maximum height of the jump in units
    this.jumpStartY = 0.1;                  // Starting Y position (slightly above ground)
    
    // Victory animation tracking
    this.victoryAnimation = false;
    this.victoryAnimationTime = 0;
    this.victoryAnimationDuration = 3000;   // Duration in milliseconds (3 seconds from animation data)
    this.victoryCooldown = false;
    
    // Debug animation tracking
    this.debugAnimationIndex = 0;
    this.debugAnimations = [
      '180-degree turn',
      '360-degree attack',
      '360-degree jumping attack',
      '360-degree low attack',
      '360-degree running turn',
      '90-degree turn left',
      '90-degree turn right',
      'Attack',
      'Attack 1',
      'Backward guarding run',
      'Crouch hit reaction',
      'Crouching',
      'Crouching attack',
      'Crouching front guard',
      'Crouching front guard draw',
      'Crouching guard idle',
      'Crouching idle',
      'Death backward',
      'Death forward',
      'Forward guard walk',
      'Forward guarding walk',
      'Front guard receiving hit',
      'Front guarding',
      'Front guarding idle',
      'Getting Damage',
      'Idle',
      'Idle 1',
      'Idle 2',
      'Idle 3',
      'Jump',
      'Jump 1',
      'Jumping Attack',
      'Kick',
      'Leftward guarding run',
      'Leftward guarding walk',
      'pointing with the hand',
      'pommel strike',
      'Rightward guarding run',
      'Rightward guarding walk',
      'Run',
      'Shield block',
      'Shielded hit',
      'standing up',
      'Sword drawing',
      'Sword sheathing',
      'Sword sheathing.001',
      'T pose',
      'T pose.001',
      'Taking damage',
      'Triple 360-degree jumping attack',
      'Victory pose',
      'War Scream'
    ];
    
    // Add keyboard controls for character movement
    this.setupKeyboardControls();
    
    // Setup on-screen instructions
    this.setupInstructions();
    
    // Extend the SceneManager's animate method to include model animations and camera following
    const originalAnimate = this.sceneManager.animate;
    this.sceneManager.animate = () => {
      requestAnimationFrame(this.sceneManager.animate.bind(this.sceneManager));
      
      // Get delta time for animation updates
      const delta = this.sceneManager.clock.getDelta();
      
      // Update character animations - using the ModelLoader's animation manager
      this.modelLoader.updateAnimations(delta);
      
      // Check for 180-degree turn animation completion
      this.check180TurnCompletion();
      
      // Update character position based on keys (continuous movement)
      this.updateCharacterPosition();
      
      // Check for animation state changes (throttled)
      const now = Date.now();
      if (now - this.lastAnimationUpdateTime >= this.animationUpdateInterval) {
        this.lastAnimationUpdateTime = now;
        this.updateCharacterAnimation();
      }
      
      // Always update follow camera
      this.updateCamera();
      
      // Render the scene
      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    };
    
    // Start animation loop
    this.sceneManager.animate();
    
    // Log animation data once loaded
    setTimeout(() => {
      this.checkAnimations();
    }, 2000); // Give time for model to load
    
    // Add debug keyboard controls
    this.setupDebugControls();
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
      crouch: false,
      turnLeft: false,
      turnRight: false,
      turn180: false,
      jump: false,
      victory: false,
      alignToggle: false
    };
    
    // Add keydown event listener
    window.addEventListener('keydown', (event) => {
      // Update keys object based on key pressed
      switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = true;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = true;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = true;
          break;
        case 'shift':
          this.keys.run = true;
          break;
        case 'control':
          this.keys.crouch = true;
          break;
        case 'q':
          // Only set turnLeft to true if not in cooldown
          if (!this.turnLeftCooldown) {
            this.keys.turnLeft = true;
          }
          break;
        case 'e':
          // Only set turnRight to true if not in cooldown
          if (!this.turnRightCooldown) {
            this.keys.turnRight = true;
          }
          break;
        case 'r':
          // 180 degree turn - only if not in cooldown
          if (!this.turn180Cooldown) {
            this.keys.turn180 = true;
          }
          break;
        case ' ': // Space key for jump
          // Only set jump to true if not in cooldown
          if (!this.jumpCooldown) {
            this.keys.jump = true;
          }
          break;
        case 'v': // V key for victory pose
          // Only set victory to true if not in cooldown
          if (!this.victoryCooldown) {
            this.keys.victory = true;
          }
          break;
        case 't':
          // Toggle camera alignment only on key press, not hold
          if (!this.keys.alignToggle) {
            this.keys.alignToggle = true;
            
            // Toggle camera mode
            this.shouldAlignWithCamera = !this.shouldAlignWithCamera;
            
            // When switching modes, reset the camera offsets
            if (this.sceneManager && this.sceneManager.followCamera) {
              this.sceneManager.followCamera.resetAngles();
            }
            
            console.log(`Camera mode: ${this.shouldAlignWithCamera ? 'FREE' : 'FOLLOWING PLAYER'}`);
            
            // Update instructions display
            const alignStatus = document.getElementById('align-status');
            if (alignStatus) {
              alignStatus.textContent = this.shouldAlignWithCamera ? 'FREE' : 'FOLLOW';
            }
          }
          break;
      }
    });
    
    // Add keyup event listener
    window.addEventListener('keyup', (event) => {
      // Update keys object based on key released
      switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = false;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = false;
          break;
        case 'shift':
          this.keys.run = false;
          break;
        case 'control':
          this.keys.crouch = false;
          break;
        case 'q':
          this.keys.turnLeft = false;
          // Reset the cooldown when key is released
          this.turnLeftCooldown = false;
          break;
        case 'e':
          this.keys.turnRight = false;
          // Reset the cooldown when key is released
          this.turnRightCooldown = false;
          break;
        case 'r':
          this.keys.turn180 = false;
          // Reset both cooldown flags when the key is released
          // This allows player to trigger a new 180 turn after letting go of the key
          if (this.turn180RotationApplied) {
            this.turn180Cooldown = false;
            this.turn180Animation = false;
            this.turn180RotationApplied = false;
          }
          break;
        case ' ': // Space key for jump
          this.keys.jump = false;
          // Cooldown will be reset after animation completes
          break;
        case 'v': // V key for victory pose
          this.keys.victory = false;
          // Cooldown will be reset after animation completes
          break;
        case 't':
          this.keys.alignToggle = false;
          break;
      }
    });
  }
  
  // Setup on-screen instructions
  setupInstructions() {
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    instructions.style.color = 'white';
    instructions.style.padding = '10px';
    instructions.style.borderRadius = '5px';
    instructions.style.fontFamily = 'Arial, sans-serif';
    instructions.style.fontSize = '14px';
    instructions.style.zIndex = '1000';
    instructions.innerHTML = `
      <h3 style="margin-top: 0;">Controls:</h3>
      <ul style="padding-left: 20px; margin-bottom: 5px;">
        <li>WASD or Arrow Keys: Move in camera/character direction</li>
        <li>Q/E: Turn left/right</li>
        <li>R: 180° quick turn</li>
        <li>Space: Jump</li>
        <li>V: Victory pose</li>
        <li>Ctrl: Crouch (hold)</li>
        <li>Shift: Run</li>
        <li>Mouse Movement: Rotate camera</li>
        <li>Mouse Wheel: Zoom in/out</li>
        <!-- <li>T: Toggle camera mode <span id="align-status">FOLLOW</span></li> -->
        <li><strong>Click</strong> to lock mouse (360° rotation)</li>
        <li>Press <strong>ESC</strong> to release mouse lock</li>
      </ul>
    `;
    document.body.appendChild(instructions);
    
    // Set initial status
    const alignStatus = document.getElementById('align-status');
    if (alignStatus) {
      alignStatus.textContent = this.shouldAlignWithCamera ? 'FREE' : 'FOLLOW';
    }
  }
  
  // Determine which animation state to apply based on inputs
  determineAnimationState() {
    // Default to idle
    let newState = this.ANIMATION_STATES.IDLE;
    
    // Check if jump animation is in progress
    if (this.jumpAnimation) {
      const elapsed = Date.now() - this.jumpAnimationTime;
      if (elapsed < this.jumpAnimationDuration) {
        // Continue playing current jump animation
        return this.currentAnimationState;
      } else {
        // Jump animation complete, reset flags
        this.jumpAnimation = false;
        this.jumpCooldown = false;
      }
    }
    
    // Check if victory animation is in progress
    if (this.victoryAnimation) {
      const elapsed = Date.now() - this.victoryAnimationTime;
      if (elapsed < this.victoryAnimationDuration) {
        // Continue playing victory animation
        return this.ANIMATION_STATES.VICTORY;
      } else {
        // Victory animation complete, reset flags
        this.victoryAnimation = false;
        this.victoryCooldown = false;
      }
    }
    
    // If a 180 turn is in progress, maintain that animation until it's complete
    if (this.turn180Animation && !this.turn180RotationApplied) {
      return this.ANIMATION_STATES.TURN_180_WALK;
    }
    
    // Check for crouching - takes priority over most movement
    if (this.keys.crouch) {
      // If we're moving while crouched, use CROUCH animation (transitions to crouched state)
      if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right) {
        return this.ANIMATION_STATES.CROUCH;
      }
      // If we're just holding crouch without movement, use crouch idle
      return this.ANIMATION_STATES.CROUCH_IDLE;
    }
    
    // Jump animation takes top priority if key is pressed and not in cooldown
    else if (this.keys.jump && !this.jumpCooldown) {
      // Set jump animation in progress
      this.jumpAnimation = true;
      this.jumpAnimationTime = Date.now();
      this.jumpCooldown = true;
      
      // Check if player is moving to determine which jump animation to use
      const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
      
      // Set the appropriate duration based on which jump animation is being used
      this.jumpAnimationDuration = isMoving ? 833 : 1000; // 0.833s for running jump, 1s for standing jump
      
      return isMoving ? this.ANIMATION_STATES.JUMP_1 : this.ANIMATION_STATES.JUMP;
    }
    // Victory animation takes priority after jump
    else if (this.keys.victory && !this.victoryCooldown) {
      // Set victory animation in progress
      this.victoryAnimation = true;
      this.victoryAnimationTime = Date.now();
      this.victoryCooldown = true;
      return this.ANIMATION_STATES.VICTORY;
    }
    // 180 turn takes priority after victory
    else if (this.keys.turn180 && !this.turn180Cooldown) {
      // Set cooldown to prevent animation repeating until key is released and pressed again
      this.turn180Cooldown = true;
      return this.ANIMATION_STATES.TURN_180_WALK;
    }
    // Turning animations take priority
    else if (this.keys.turnLeft && !this.turnLeftCooldown) {
      // Set cooldown to prevent animation repeating until key is released and pressed again
      this.turnLeftCooldown = true;
      return this.ANIMATION_STATES.TURN_LEFT_IDLE;
    } 
    else if (this.keys.turnRight && !this.turnRightCooldown) {
      // Set cooldown to prevent animation repeating until key is released and pressed again
      this.turnRightCooldown = true;
      return this.ANIMATION_STATES.TURN_RIGHT_IDLE;
    }
    
    // Check for diagonal movement first (combined forward/backward with left/right)
    // This ensures proper strafing animations when moving diagonally
    
    // Forward + left/right diagonal movement
    if (this.keys.forward) {
      if (this.keys.left) {
        // Forward + left diagonal movement
        return this.keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
      }
      else if (this.keys.right) {
        // Forward + right diagonal movement
        return this.keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
      }
      // Pure forward movement (no diagonal)
      return this.keys.run ? this.ANIMATION_STATES.RUN_FORWARD : this.ANIMATION_STATES.WALK_FORWARD;
    }
    // Backward + left/right diagonal movement
    else if (this.keys.backward) {
      if (this.keys.left) {
        // Backward + left diagonal movement
        return this.keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
      }
      else if (this.keys.right) {
        // Backward + right diagonal movement
        return this.keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
      }
      // Pure backward movement (no diagonal)
      return this.keys.run ? this.ANIMATION_STATES.RUN_BACK : this.ANIMATION_STATES.WALK_BACK;
    }
    // Pure strafing (no forward/backward component)
    else if (this.keys.left) {
      return this.keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
    }
    else if (this.keys.right) {
      return this.keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
    }
    
    // Default to idle if no movement keys are pressed
    return this.ANIMATION_STATES.IDLE;
  }
  
  // Update character animation based on keyboard input
  updateCharacterAnimation() {
    // Check if character is loaded
    if (this.modelLoader.character) {
      // Determine which animation state to apply
      const newState = this.determineAnimationState();
      
      // Log current animation state for debugging
      if (newState !== this.currentAnimationState) {
        console.log(`Changing animation from "${this.currentAnimationState}" to "${newState}"`);
        this.currentAnimationState = newState;
        
        // Try to play the animation
        try {
          const success = this.modelLoader.playCharacterAnimation(newState);
          if (!success) {
            console.warn(`Failed to set animation state: ${newState}`);
          }
        } catch (error) {
          console.error(`Error playing animation "${newState}":`, error);
        }
      }
    }
  }
  
  // Debug method to check animations
  checkAnimations() {
    if (this.modelLoader && this.modelLoader.animationManager) {
      console.log("Animation Manager:", this.modelLoader.animationManager);
      console.log("Animation Actions:", this.modelLoader.animationManager.animationActions);
      console.log("Available States:", Object.keys(this.modelLoader.animationManager.animationStates));
      console.log("Current State:", this.modelLoader.animationManager.currentState);
    } else {
      console.warn("Animation manager not ready or not available");
    }
  }
  
  // Update character position based on keyboard input
  updateCharacterPosition() {
    if (this.modelLoader.character) {
      const speed = this.keys.run ? this.runSpeed : this.moveSpeed;
      
      // Determine the rotation angle to use
      let movementAngle;
      if (this.shouldAlignWithCamera) {
        // Get camera's forward direction for movement when in FREE mode
        const cameraDirection = this.sceneManager.followCamera.getForwardDirection();
        
        // Get camera's horizontal angle (absolute, not relative to character)
        const cameraAngle = this.sceneManager.followCamera.horizontalAngle;
        
        // Use camera angle directly
        movementAngle = cameraAngle;
        
        // Rotate the character model to face the same direction as the camera
        this.characterRotation = cameraAngle;
        this.modelLoader.rotateCharacter(this.characterRotation);
      } else {
        // In FOLLOW mode, use player's rotation plus any camera offset
        const playerDirection = this.sceneManager.followCamera.getPlayerForwardDirection(this.characterRotation);
        
        // Character rotation stays independent of camera
        movementAngle = this.characterRotation;
      }
      
      // Handle 180-degree turn 
      if (this.keys.turn180 && !this.turn180Cooldown) {
        // Start new 180-degree turn animation but don't rotate character yet
        this.turn180Animation = true;
        this.turn180AnimationTime = Date.now();
        this.turn180RotationApplied = false;
      }
      
      // Handle jump bounce for running jump
      if (this.jumpAnimation && this.currentAnimationState === this.ANIMATION_STATES.JUMP_1) {
        const elapsed = Date.now() - this.jumpAnimationTime;
        const progress = elapsed / this.jumpAnimationDuration; // 0 to 1
        
        // Create a smooth arc motion using sine
        // This creates a nice parabolic arc: up and then down
        const jumpProgress = Math.sin(progress * Math.PI);
        this.characterPosition.y = this.jumpStartY + (this.jumpHeight * jumpProgress);
      } else {
        // Reset Y position when not jumping
        this.characterPosition.y = this.jumpStartY;
      }
      
      // Don't allow movement during special animations or when crouching
      if ((this.turn180Animation && !this.turn180RotationApplied) || 
          this.victoryAnimation ||
          this.keys.crouch) {
        // Skip movement calculations during special animations
        return;
      }
      
      // Handle explicit rotation (Q and E keys)
      // Continue rotation even during cooldown (animation won't repeat but rotation will continue)
      if (this.keys.turnLeft || this.turnLeftCooldown) {
        this.characterRotation += this.turnSpeed;
        this.modelLoader.rotateCharacter(this.characterRotation);
      }
      else if (this.keys.turnRight || this.turnRightCooldown) {
        this.characterRotation -= this.turnSpeed;
        this.modelLoader.rotateCharacter(this.characterRotation);
      }
      
      // Calculate movement based on the determined angle
      let dx = 0;
      let dz = 0;
      
      // Forward/backward movement along character's facing direction
      if (this.keys.forward) {
        dx += Math.sin(movementAngle) * speed;
        dz += Math.cos(movementAngle) * speed;
      }
      else if (this.keys.backward) {
        dx -= Math.sin(movementAngle) * speed;
        dz -= Math.cos(movementAngle) * speed;
      }
      
      // Strafing perpendicular to facing direction
      if (this.keys.left) {
        dx += Math.cos(movementAngle) * speed;
        dz -= Math.sin(movementAngle) * speed;
      }
      else if (this.keys.right) {
        dx -= Math.cos(movementAngle) * speed;
        dz += Math.sin(movementAngle) * speed;
      }
      
      // Update position
      this.characterPosition.x += dx;
      this.characterPosition.z += dz;
      
      // Apply position to character model
      this.modelLoader.moveCharacter(this.characterPosition.x, this.characterPosition.z);
    }
  }
  
  // Update camera to follow character
  updateCamera() {
    if (this.modelLoader.character && this.characterPosition) {
      // Update the follow camera with character position and rotation
      // Pass character rotation when alignment is off so camera follows player rotation
      if (!this.shouldAlignWithCamera) {
        this.sceneManager.followCamera.update(this.characterPosition, this.characterRotation);
      } else {
        // When alignment is on, we don't need to pass rotation as the camera controls the rotation
        this.sceneManager.followCamera.update(this.characterPosition, 0);
      }
    }
  }
  
  // Check if 180-degree turn animation has completed and handle rotation
  check180TurnCompletion() {
    if (this.turn180Animation && !this.turn180RotationApplied) {
      const now = Date.now();
      const elapsed = now - this.turn180AnimationTime;
      
      // If the animation has played for the full duration, apply the rotation
      if (elapsed >= this.turn180AnimationDuration) {
        // Rotate character 180 degrees (PI radians)
        this.characterRotation += Math.PI;
        this.modelLoader.rotateCharacter(this.characterRotation);
        
        // Mark rotation as applied to prevent repeated application
        this.turn180RotationApplied = true;
        
        // Keep animation flag true until key is released
        // This prevents animation from resetting to idle
      }
    }
  }
  
  // Setup debug controls
  setupDebugControls() {
    window.addEventListener('keydown', (event) => {
      // Debug controls only work when holding Shift
      if (!event.shiftKey) return;
      
      switch(event.key.toLowerCase()) {
        case 'n':
          // Next animation
          this.debugAnimationIndex = (this.debugAnimationIndex + 1) % this.debugAnimations.length;
          this.playDebugAnimation(this.debugAnimations[this.debugAnimationIndex]);
          break;
        case 'p':
          // Previous animation
          this.debugAnimationIndex = (this.debugAnimationIndex - 1 + this.debugAnimations.length) % this.debugAnimations.length;
          this.playDebugAnimation(this.debugAnimations[this.debugAnimationIndex]);
          break;
        case 'r':
          // Random animation
          this.debugAnimationIndex = Math.floor(Math.random() * this.debugAnimations.length);
          this.playDebugAnimation(this.debugAnimations[this.debugAnimationIndex]);
          break;
        case 'i':
          // Print current animation info
          console.log('Current animation:', this.debugAnimations[this.debugAnimationIndex]);
          console.log('Index:', this.debugAnimationIndex);
          break;
        case 'l':
          // List all animations
          console.log('Available animations:');
          this.debugAnimations.forEach((anim, index) => {
            console.log(`${index}: ${anim}`);
          });
          break;
      }
    });
  }
  
  // Play animation directly by name
  playDebugAnimation(animationName) {
    if (!this.modelLoader || !this.modelLoader.animationManager) {
      console.warn('Animation manager not ready');
      return;
    }
    
    console.log(`Playing animation: ${animationName}`);
    
    // Find the animation in the model's animations
    const animation = this.modelLoader.animationManager.animations.find(
      clip => clip.name === animationName
    );
    
    if (!animation) {
      console.warn(`Animation "${animationName}" not found`);
      return;
    }
    
    // Create a temporary action for this animation
    const action = this.modelLoader.animationManager.mixer.clipAction(animation);
    
    // Stop all current animations
    this.modelLoader.animationManager.mixer.stopAllAction();
    
    // Play the new animation
    action.reset();
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.play();
    
    // Store the current animation name for reference
    this.currentDebugAnimation = animationName;
    
    // Log animation duration
    console.log(`Animation duration: ${animation.duration}s`);
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // You can specify a different model path
  const game = new ArenaGame('./your-model.glb');
  
  // Make the game available globally for debugging
  window.game = game;
});