export class CharacterController {
  constructor(modelLoader, inputController) {
    this.modelLoader = modelLoader;
    this.inputController = inputController;
    
    // Character position and rotation
    this.position = {
      x: 0,
      y: 0.1, // Slightly above ground to prevent z-fighting
      z: 0
    };
    
    this.rotation = 0; // In radians
    this.moveSpeed = 0.035; // Regular movement speed
    this.runSpeed = 0.06; // Run movement speed
    this.turnSpeed = 0.01; // Rotation speed
    this.shouldAlignWithCamera = false; // Whether character should align with camera direction
    
    // Camera rotation tracking for smooth turns
    this.cameraRotation = 0; // Used to track camera position during animations
    
    // Turn animation cooldown flags
    this.turnLeftCooldown = false;
    this.turnRightCooldown = false;
    this.turn180Cooldown = false;
    
    // Turn angle tracking for fixed rotation amounts
    this.turnLeftAngle = 0;
    this.turnRightAngle = 0;
    this.turnTargetAngle = Math.PI / 3; // 45 degrees per turn
    
    // 180-degree turn animation tracking
    this.turn180Animation = false;
    this.turn180AnimationTime = 0;          // Track when animation started
    this.turn180AnimationDuration = 866;    // Duration in milliseconds (0.833 seconds from animation data)
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
  }
  
  // Update character position based on keyboard input
  updatePosition(cameraForwardAngle) {
    if (!this.modelLoader.character) return;
    
    const keys = this.inputController.keys;
    const speed = keys.run ? this.runSpeed : this.moveSpeed;
    
    // Determine the rotation angle to use
    let movementAngle;
    if (this.shouldAlignWithCamera) {
      // Use camera angle directly
      movementAngle = cameraForwardAngle;
      
      // Rotate the character model to face the same direction as the camera
      this.rotation = cameraForwardAngle;
      this.modelLoader.rotateCharacter(this.rotation);
    } else {
      // In FOLLOW mode, use player's rotation 
      movementAngle = this.rotation;
    }
    
    // Handle 180-degree turn 
    if (keys.turn180 && !this.turn180Cooldown) {
      // Start new 180-degree turn animation but don't rotate character yet
      this.turn180Animation = true;
      this.turn180AnimationTime = Date.now();
      this.turn180RotationApplied = false;
    }
    
    // Handle jump bounce for running jump
    if (this.jumpAnimation) {
      const elapsed = Date.now() - this.jumpAnimationTime;
      const progress = elapsed / this.jumpAnimationDuration; // 0 to 1
      
      // Create a smooth arc motion using sine
      // This creates a nice parabolic arc: up and then down
      const jumpProgress = Math.sin(progress * Math.PI);
      this.position.y = this.jumpStartY + (this.jumpHeight * jumpProgress);
      
      // Check if jump animation is complete
      if (progress >= 1) {
        // Reset jump flags
        this.jumpAnimation = false;
        this.jumpCooldown = false;
        this.position.y = this.jumpStartY; // Ensure we land exactly at the start Y
      }
    } else {
      // Reset Y position when not jumping
      this.position.y = this.jumpStartY;
    }
    
    // Don't allow movement during special animations or when crouching
    if ((this.turn180Animation && !this.turn180RotationApplied) || 
        this.victoryAnimation ||
        keys.crouch) {
      // Skip movement calculations during special animations
      return;
    }
    
    // Handle fixed amount rotation for Q and E keys
    this.handleRotationControls();
    
    // Calculate movement based on the determined angle
    let dx = 0;
    let dz = 0;
    
    // Forward/backward movement along character's facing direction
    if (keys.forward) {
      dx += Math.sin(movementAngle) * speed;
      dz += Math.cos(movementAngle) * speed;
    }
    else if (keys.backward) {
      dx -= Math.sin(movementAngle) * speed;
      dz -= Math.cos(movementAngle) * speed;
    }
    
    // Strafing perpendicular to facing direction
    if (keys.left) {
      dx += Math.cos(movementAngle) * speed;
      dz -= Math.sin(movementAngle) * speed;
    }
    else if (keys.right) {
      dx -= Math.cos(movementAngle) * speed;
      dz += Math.sin(movementAngle) * speed;
    }
    
    // Update position
    this.position.x += dx;
    this.position.z += dz;
    
    // Apply position to character model
    this.modelLoader.moveCharacter(this.position.x, this.position.z);
  }
  
  // Handle rotation controls for Q and E keys with fixed rotation amounts
  handleRotationControls() {
    const keys = this.inputController.keys;
    const rotationSpeed = this.turnSpeed * 1.1; // Faster rotation for fixed amounts
    
    // Handle left turn (Q key)
    if (keys.turnLeft) {
      // Start tracking a new turn
      if (this.turnLeftAngle === 0) {
        this.turnLeftAngle = this.turnTargetAngle;
      }
    } else if (this.turnLeftAngle > 0) {
      // Key was released, stop the rotation
      this.turnLeftAngle = 0;
      this.turnLeftCooldown = false;
    }
    
    // Handle right turn (E key)
    if (keys.turnRight) {
      // Start tracking a new turn
      if (this.turnRightAngle === 0) {
        this.turnRightAngle = this.turnTargetAngle;
      }
    } else if (this.turnRightAngle > 0) {
      // Key was released, stop the rotation
      this.turnRightAngle = 0;
      this.turnRightCooldown = false;
    }
    
    // Apply remaining left turn rotation
    if (this.turnLeftAngle > 0) {
      // Calculate how much to rotate this frame, but don't exceed remaining angle
      const rotationAmount = Math.min(rotationSpeed, this.turnLeftAngle);
      this.rotation += rotationAmount;
      this.turnLeftAngle -= rotationAmount;
      
      // Apply the rotation to the character model
      this.modelLoader.rotateCharacter(this.rotation);
      
      // Set cooldown for animation purposes
      this.turnLeftCooldown = true;
      
      // If turn is complete, reset cooldown
      if (this.turnLeftAngle <= 0) {
        this.turnLeftAngle = 0;
        // Keep cooldown true until animation completes
      }
    } else {
      // No turn in progress, so no cooldown
      this.turnLeftCooldown = false;
    }
    
    // Apply remaining right turn rotation
    if (this.turnRightAngle > 0) {
      // Calculate how much to rotate this frame, but don't exceed remaining angle
      const rotationAmount = Math.min(rotationSpeed, this.turnRightAngle);
      this.rotation -= rotationAmount;
      this.turnRightAngle -= rotationAmount;
      
      // Apply the rotation to the character model
      this.modelLoader.rotateCharacter(this.rotation);
      
      // Set cooldown for animation purposes
      this.turnRightCooldown = true;
      
      // If turn is complete, reset cooldown
      if (this.turnRightAngle <= 0) {
        this.turnRightAngle = 0;
        // Keep cooldown true until animation completes
      }
    } else {
      // No turn in progress, so no cooldown
      this.turnRightCooldown = false;
    }
  }
  
  // Check if 180-degree turn animation has completed and handle rotation
  check180TurnCompletion() {
    if (this.turn180Animation && !this.turn180RotationApplied) {
      const now = Date.now();
      const elapsed = now - this.turn180AnimationTime;
      
      // Calculate the progress of the 180-degree turn animation (0 to 1)
      const progress = Math.min(1, elapsed / this.turn180AnimationDuration);
      
      // Calculate progressive camera rotation for smooth camera movement
      // The character itself will only rotate after the animation
      const totalRotationAmount = Math.PI; // 180 degrees
      this.cameraRotation = this.rotation + (totalRotationAmount * progress);
      
      // Apply the character rotation only when the animation is fully complete
      if (progress >= 1 && !this.turn180RotationApplied) {
        // Apply the full 180 degree rotation to the character
        this.rotation += Math.PI;
        this.modelLoader.rotateCharacter(this.rotation);
        
        // Mark rotation as applied to prevent repeated application
        this.turn180RotationApplied = true;
        
        // Ensure camera rotation matches the new character rotation
        this.cameraRotation = this.rotation;
      }
    }
  }
  
  // Get current rotation to use for camera positioning
  // This allows the camera to follow a smooth path during animations
  getCameraRotation() {
    // During 180 turn animation, return the smooth camera rotation
    if (this.turn180Animation) {
      // For the entire animation period until rotation is applied, use the animation-based camera rotation
      if (!this.turn180RotationApplied) {
        return this.cameraRotation;
      }
      
      // After rotation is applied, use actual rotation
      return this.rotation;
    }
    
    // Otherwise return the actual character rotation
    return this.rotation;
  }
  
  // Toggle alignment with camera
  toggleCameraAlignment() {
    this.shouldAlignWithCamera = !this.shouldAlignWithCamera;
    return this.shouldAlignWithCamera;
  }
  
  // Reset state for special actions
  resetActionStates(action) {
    switch(action) {
      case 'turnLeft':
        this.turnLeftCooldown = false;
        this.turnLeftAngle = 0;
        break;
      case 'turnRight':
        this.turnRightCooldown = false;
        this.turnRightAngle = 0;
        break;
      case 'turn180':
        if (this.turn180RotationApplied) {
          this.turn180Cooldown = false;
          this.turn180Animation = false;
          this.turn180RotationApplied = false;
        }
        break;
      case 'jump':
        this.jumpAnimation = false;
        this.jumpCooldown = false;
        break;
      case 'victory':
        this.victoryAnimation = false;
        this.victoryCooldown = false;
        break;
    }
  }
  
  // Start special animation
  startSpecialAnimation(animation) {
    switch(animation) {
      case 'jump':
        if (!this.jumpCooldown) {
          this.jumpAnimation = true;
          this.jumpAnimationTime = Date.now();
          this.jumpCooldown = true;
          
          // Check if player is moving to determine appropriate duration
          const isMoving = this.inputController.keys.forward || 
                          this.inputController.keys.backward || 
                          this.inputController.keys.left || 
                          this.inputController.keys.right;
          
          this.jumpAnimationDuration = isMoving ? 833 : 1000; // 0.833s for running jump, 1s for standing jump
          return true;
        }
        return false;
        
      case 'victory':
        if (!this.victoryCooldown) {
          this.victoryAnimation = true;
          this.victoryAnimationTime = Date.now();
          this.victoryCooldown = true;
          return true;
        }
        return false;
        
      case 'turn180':
        if (!this.turn180Cooldown) {
          this.turn180Animation = true;
          this.turn180AnimationTime = Date.now();
          this.turn180RotationApplied = false;
          this.turn180Cooldown = true;
          return true;
        }
        return false;
        
      case 'turnLeft':
        if (!this.turnLeftCooldown && this.turnLeftAngle === 0) {
          this.turnLeftAngle = this.turnTargetAngle;
          return true;
        }
        return false;
        
      case 'turnRight':
        if (!this.turnRightCooldown && this.turnRightAngle === 0) {
          this.turnRightAngle = this.turnTargetAngle;
          return true;
        }
        return false;
    }
    
    return false;
  }
  
  // Check if animation is active
  isAnimationActive(animation) {
    switch(animation) {
      case 'jump':
        if (this.jumpAnimation) {
          const elapsed = Date.now() - this.jumpAnimationTime;
          if (elapsed >= this.jumpAnimationDuration) {
            // Animation has completed, reset flags
            this.jumpAnimation = false;
            this.jumpCooldown = false;
            return false;
          }
          return true;
        }
        return false;
        
      case 'victory':
        if (this.victoryAnimation) {
          const elapsed = Date.now() - this.victoryAnimationTime;
          if (elapsed >= this.victoryAnimationDuration) {
            // Animation has completed, reset flags
            this.victoryAnimation = false;
            this.victoryCooldown = false;
            return false;
          }
          return true;
        }
        return false;
        
      case 'turn180':
        return this.turn180Animation && !this.turn180RotationApplied;
        
      case 'turnLeft':
        return this.turnLeftAngle > 0;
        
      case 'turnRight':
        return this.turnRightAngle > 0;
    }
    
    return false;
  }
} 