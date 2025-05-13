export class AnimationStateController {
  constructor(modelLoader, characterController, inputController) {
    this.modelLoader = modelLoader;
    this.characterController = characterController;
    this.inputController = inputController;
    
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
    
    // Animation duration tracking
    this.animationDurations = {
      [this.ANIMATION_STATES.TURN_180_WALK]: 833    // From character controller
    };
    
    // Animation state tracking
    this.currentAnimationState = this.ANIMATION_STATES.IDLE;
    this.lastAnimationUpdateTime = 0;
    this.animationUpdateInterval = 100; // milliseconds between animation state evaluations
    
    // Animation timing tracking
    this.currentAnimationStartTime = 0;
    
    // Turn animation delay timer to prevent rapid flickering
    this.turnAnimationDelay = 200;  // ms delay before showing turn animation
    this.turnLeftStartTime = 0;
    this.turnRightStartTime = 0;
    this.isTurningLeft = false;
    this.isTurningRight = false;
    
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
  }
  
  // Update character animation based on keyboard input
  updateAnimation() {
    // Check if character is loaded
    if (!this.modelLoader.character) return;
    
    // Throttle animation updates to reduce overhead
    const now = Date.now();
    if (now - this.lastAnimationUpdateTime < this.animationUpdateInterval) {
      return;
    }
    this.lastAnimationUpdateTime = now;
    
    // Check if current animation should be completed
    const currentAnimationDuration = this.animationDurations[this.currentAnimationState];
    if (currentAnimationDuration) {
      const elapsed = now - this.currentAnimationStartTime;
      if (elapsed < currentAnimationDuration) {
        // Don't interrupt ongoing animations with set durations
        return;
      }
    }
    
    // Determine which animation state to apply
    const newState = this.determineAnimationState();
    
    // Only update if the animation state has changed
    if (newState !== this.currentAnimationState) {
      console.log(`Changing animation from "${this.currentAnimationState}" to "${newState}"`);
      this.currentAnimationState = newState;
      this.currentAnimationStartTime = now;
      
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
  
  // Determine which animation state to apply based on inputs
  determineAnimationState() {
    const keys = this.inputController.keys;
    const now = Date.now();
    
    // Default to idle
    let newState = this.ANIMATION_STATES.IDLE;
    
    // Check if jump animation is in progress
    if (this.characterController.isAnimationActive('jump')) {
      // Continue playing current jump animation
      return this.currentAnimationState;
    }
    
    // Check if victory animation is in progress
    if (this.characterController.isAnimationActive('victory')) {
      return this.ANIMATION_STATES.VICTORY;
    }
    
    // If a 180 turn is in progress, maintain that animation until it's complete
    if (this.characterController.isAnimationActive('turn180')) {
      return this.ANIMATION_STATES.TURN_180_WALK;
    }
    
    // Check for crouching - takes priority over most movement
    if (keys.crouch) {
      // If we're moving while crouched, use CROUCH animation (transitions to crouched state)
      if (keys.forward || keys.backward || keys.left || keys.right) {
        return this.ANIMATION_STATES.CROUCH;
      }
      // If we're just holding crouch without movement, use crouch idle
      return this.ANIMATION_STATES.CROUCH_IDLE;
    }
    
    // Jump animation takes top priority if key is pressed and not in cooldown
    else if (keys.jump && this.characterController.startSpecialAnimation('jump')) {
      // Check if player is moving to determine which jump animation to use
      const isMoving = keys.forward || keys.backward || keys.left || keys.right;
      return isMoving ? this.ANIMATION_STATES.JUMP_1 : this.ANIMATION_STATES.JUMP;
    }
    
    // Victory animation takes priority after jump
    else if (keys.victory && this.characterController.startSpecialAnimation('victory')) {
      return this.ANIMATION_STATES.VICTORY;
    }
    
    // 180 turn takes priority after victory
    else if (keys.turn180 && this.characterController.startSpecialAnimation('turn180')) {
      return this.ANIMATION_STATES.TURN_180_WALK;
    }
    
    // Handle turn animations with a small delay to prevent flickering during continuous rotation
    if (keys.turnLeft) {
      if (!this.isTurningLeft) {
        this.turnLeftStartTime = now;
        this.isTurningLeft = true;
      }
      
      if (now - this.turnLeftStartTime > this.turnAnimationDelay) {
        // Check if we need to start the animation
        if (this.characterController.startSpecialAnimation('turnLeft')) {
          return this.ANIMATION_STATES.TURN_LEFT_IDLE;
        }
        return this.ANIMATION_STATES.TURN_LEFT_IDLE;
      }
    } else {
      this.isTurningLeft = false;
    }
    
    if (keys.turnRight) {
      if (!this.isTurningRight) {
        this.turnRightStartTime = now;
        this.isTurningRight = true;
      }
      
      if (now - this.turnRightStartTime > this.turnAnimationDelay) {
        // Check if we need to start the animation
        if (this.characterController.startSpecialAnimation('turnRight')) {
          return this.ANIMATION_STATES.TURN_RIGHT_IDLE;
        }
        return this.ANIMATION_STATES.TURN_RIGHT_IDLE;
      }
    } else {
      this.isTurningRight = false;
    }
    
    // Check for diagonal movement first (combined forward/backward with left/right)
    // This ensures proper strafing animations when moving diagonally
    
    // Forward + left/right diagonal movement
    if (keys.forward) {
      if (keys.left) {
        // Forward + left diagonal movement
        return keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
      }
      else if (keys.right) {
        // Forward + right diagonal movement
        return keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
      }
      // Pure forward movement (no diagonal)
      return keys.run ? this.ANIMATION_STATES.RUN_FORWARD : this.ANIMATION_STATES.WALK_FORWARD;
    }
    
    // Backward + left/right diagonal movement
    else if (keys.backward) {
      if (keys.left) {
        // Backward + left diagonal movement
        return keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
      }
      else if (keys.right) {
        // Backward + right diagonal movement
        return keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
      }
      // Pure backward movement (no diagonal)
      return keys.run ? this.ANIMATION_STATES.RUN_BACK : this.ANIMATION_STATES.WALK_BACK;
    }
    
    // Pure strafing (no forward/backward component)
    else if (keys.left) {
      return keys.run ? this.ANIMATION_STATES.STRAFE_LEFT_RUN : this.ANIMATION_STATES.STRAFE_LEFT_WALK;
    }
    else if (keys.right) {
      return keys.run ? this.ANIMATION_STATES.STRAFE_RIGHT_RUN : this.ANIMATION_STATES.STRAFE_RIGHT_WALK;
    }
    
    // Check if we're still in a turn animation but the key was released
    if (this.currentAnimationState === this.ANIMATION_STATES.TURN_LEFT_IDLE || 
        this.currentAnimationState === this.ANIMATION_STATES.TURN_RIGHT_IDLE) {
      const elapsed = now - this.currentAnimationStartTime;
      // Keep playing turn animation for a short time after key release to make it look smoother
      if (elapsed < 300) {
        return this.currentAnimationState;
      }
    }
    
    // Default to idle if no movement keys are pressed
    return this.ANIMATION_STATES.IDLE;
  }
  
  // Play a debug animation directly by index
  playDebugAnimationByIndex(index) {
    this.debugAnimationIndex = index % this.debugAnimations.length;
    return this.playDebugAnimation(this.debugAnimations[this.debugAnimationIndex]);
  }
  
  // Play a debug animation directly by name
  playDebugAnimation(animationName) {
    if (!this.modelLoader || !this.modelLoader.animationManager) {
      console.warn('Animation manager not ready');
      return false;
    }
    
    console.log(`Playing animation: ${animationName}`);
    
    // Find the animation in the model's animations
    const animation = this.modelLoader.animationManager.animations.find(
      clip => clip.name === animationName
    );
    
    if (!animation) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
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
    
    // Log animation duration
    console.log(`Animation duration: ${animation.duration}s`);
    return true;
  }
  
  // List available animations
  listAnimations() {
    console.log('Available animations:');
    this.debugAnimations.forEach((anim, index) => {
      console.log(`${index}: ${anim}`);
    });
  }
  
  // Get available animation names
  getAvailableAnimations() {
    return [...this.debugAnimations];
  }
  
  // Get the current animation state
  getCurrentAnimationState() {
    return this.currentAnimationState;
  }
  
  // Handle debug key events 
  handleDebugKeyEvent(event) {
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
        this.listAnimations();
        break;
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
} 