import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, target = null) {
    this.camera = camera;
    this.target = target;
    
    // Camera follow settings
    this.offset = new THREE.Vector3(0, 3, 5); // Position offset behind and above player
    this.lookOffset = new THREE.Vector3(0, 1, 0); // Look slightly above player
    this.damping = 0.1; // Smoothing factor for horizontal movement (0 = instant, 1 = no movement)
    this.verticalDamping = 0.05; // Stronger damping for vertical movement to reduce wobble
    this.rotationDamping = 0.05; // Rotation smoothing
    
    // Orbit camera settings
    this.minDistance = 2; // Minimum distance from target
    this.maxDistance = 45; // Maximum distance from target
    this.zoomSpeed = 0.5; // How fast to zoom in/out with mouse wheel
    this.currentDistance = 5; // Current distance from target
    
    // Mouse look settings
    this.horizontalAngle = 0; // Horizontal rotation angle (around Y axis)
    this.verticalAngle = 0; // Vertical rotation angle (around X axis)
    this.mouseSensitivity = 0.002; // Mouse sensitivity
    this.verticalAngleLimit = Math.PI / 2; // Increased limit for vertical rotation (90 degrees)
    
    // Ground constraints
    this.groundLevel = 0.5; // Minimum height above ground level
    
    // Pointer lock flag
    this.pointerLocked = false;
    
    // Current camera target position
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    
    // Previous target position for velocity calculation
    this.previousTargetY = 0;
    this.targetYVelocity = 0;
    this.verticalSmoothingFactor = 0.95; // Smooth out vertical movement
    
    // Initialize with camera's current position
    if (camera) {
      this.currentPosition.copy(camera.position);
    }
    
    // Setup mouse events
    this.setupMouseControls();
  }
  
  // Set the target for the camera to follow
  setTarget(target) {
    this.target = target;
  }
  
  // Set pointer lock state
  setPointerLocked(locked) {
    this.pointerLocked = locked;
  }
  
  // Setup mouse controls for camera rotation
  setupMouseControls() {
    // Store context for event handlers
    const self = this;
    
    // Mouse move event - rotates camera without requiring mouse button press
    document.addEventListener('mousemove', function(event) {
      // Only rotate camera if pointer is locked
      if (self.pointerLocked) {
        // Update horizontal and vertical angles based on mouse movement
        self.horizontalAngle -= event.movementX * self.mouseSensitivity;
        self.verticalAngle -= event.movementY * self.mouseSensitivity;
        
        // Limit vertical angle - allow more range for orbit camera
        self.verticalAngle = Math.max(
          -self.verticalAngleLimit,
          Math.min(self.verticalAngleLimit, self.verticalAngle)
        );
        
        // If vertical angle is too low, it could cause camera to go underground
        // Check if we need to limit the downward angle to prevent this
        if (self.verticalAngle < -Math.PI / 4) { // -45 degrees
          // Check the theoretical camera height
          const targetPosition = self.target ? self.target : new THREE.Vector3();
          const playerHeight = targetPosition.y || 0;
          const verticalDistance = self.currentDistance * Math.sin(self.verticalAngle);
          const potentialHeight = playerHeight + self.offset.y + verticalDistance;
          
          // If the potential height is too low, adjust the vertical angle
          if (potentialHeight < self.groundLevel) {
            // Calculate the maximum downward angle that would keep us above ground
            const maxDownAngle = Math.asin((self.groundLevel - playerHeight - self.offset.y) / self.currentDistance);
            self.verticalAngle = Math.max(maxDownAngle, self.verticalAngle);
          }
        }
      }
    });
    
    // Add mouse wheel support for zooming in/out
    document.addEventListener('wheel', function(event) {
      // Store old distance to check if we need to adjust vertical angle
      const oldDistance = self.currentDistance;
      
      // Adjust distance based on wheel movement
      self.currentDistance += event.deltaY * 0.01 * self.zoomSpeed;
      
      // Clamp distance between min and max
      self.currentDistance = Math.max(
        self.minDistance,
        Math.min(self.maxDistance, self.currentDistance)
      );
      
      // If we're zooming in and the vertical angle is negative (pointing down),
      // check if we need to adjust the vertical angle to prevent going underground
      if (self.currentDistance < oldDistance && self.verticalAngle < 0) {
        const targetPosition = self.target ? self.target : new THREE.Vector3();
        const playerHeight = targetPosition.y || 0;
        const verticalDistance = self.currentDistance * Math.sin(self.verticalAngle);
        const potentialHeight = playerHeight + self.offset.y + verticalDistance;
        
        // If the potential height is too low, adjust the vertical angle
        if (potentialHeight < self.groundLevel) {
          // Calculate the maximum downward angle that would keep us above ground
          const maxDownAngle = Math.asin((self.groundLevel - playerHeight - self.offset.y) / self.currentDistance);
          self.verticalAngle = Math.max(maxDownAngle, self.verticalAngle);
        }
      }
    });
    
    // Prevent context menu on right-click
    document.addEventListener('contextmenu', function(event) {
      event.preventDefault();
    });
  }
  
  // Update camera position and rotation
  update(playerPosition, playerRotation) {
    if (!this.camera || !playerPosition) return;
    
    // Calculate camera position based on spherical coordinates
    const targetPosition = new THREE.Vector3();
    
    // If playerRotation is provided (follow mode), use it as the base angle
    // Otherwise use the camera's horizontal angle (free mode)
    let baseAngle = this.horizontalAngle;
    if (playerRotation !== 0 && playerRotation !== undefined) {
      // We're in follow mode - use player rotation as base
      // But still allow mouse to look around relative to player rotation
      baseAngle = playerRotation + this.horizontalAngle;
    }
    
    // Use the base angle for positioning
    const totalHorizontalAngle = baseAngle;
    
    // Calculate position using spherical coordinates
    // Use currentDistance instead of fixed offset.z for zooming
    const horizontalDistance = this.currentDistance * Math.cos(this.verticalAngle);
    const verticalDistance = this.currentDistance * Math.sin(this.verticalAngle);
    
    // Calculate camera position components
    const offsetX = Math.sin(totalHorizontalAngle) * horizontalDistance;
    const offsetZ = Math.cos(totalHorizontalAngle) * horizontalDistance;
    const offsetY = this.offset.y + verticalDistance;
    
    // Calculate vertical velocity for smoother vertical tracking
    const currentTargetY = playerPosition.y;
    this.targetYVelocity = (currentTargetY - this.previousTargetY) * 0.1; // Scale down velocity
    this.previousTargetY = currentTargetY;
    
    // Apply smoothing to vertical velocity
    this.targetYVelocity *= this.verticalSmoothingFactor;
    
    // Add a fixed height offset to keep camera higher than player
    const fixedHeightOffset = 1.0;
    
    // Set target position with stabilized vertical position
    targetPosition.set(
      playerPosition.x - offsetX, 
      (playerPosition.y + offsetY + fixedHeightOffset) + this.targetYVelocity, 
      playerPosition.z - offsetZ
    );
    
    // Create look-at target - always look at the player
    const lookTarget = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + this.lookOffset.y,
      playerPosition.z
    );
    
    // Separately handle horizontal and vertical interpolation with different damping values
    // Horizontal position (x, z) - normal damping
    this.currentPosition.x = this.currentPosition.x + (targetPosition.x - this.currentPosition.x) * (1 - this.damping);
    this.currentPosition.z = this.currentPosition.z + (targetPosition.z - this.currentPosition.z) * (1 - this.damping);
    
    // Vertical position (y) - increased damping for smoother vertical movement
    this.currentPosition.y = this.currentPosition.y + (targetPosition.y - this.currentPosition.y) * (1 - this.verticalDamping);
    
    // Ensure camera doesn't go below ground level
    if (this.currentPosition.y < this.groundLevel) {
      this.currentPosition.y = this.groundLevel;
    }
    
    // Smooth look-at target
    this.currentLookAt.lerp(lookTarget, 1 - this.rotationDamping);
    
    // Apply position to the actual camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
  
  // Get the forward direction based on camera horizontal angle
  getForwardDirection() {
    // Create direction vector
    const direction = new THREE.Vector3(
      Math.sin(this.horizontalAngle),
      0,
      Math.cos(this.horizontalAngle)
    );
    
    return direction.normalize();
  }
  
  // Get the combined forward direction (player rotation + camera offset)
  getPlayerForwardDirection(playerRotation) {
    // If player rotation is provided, combine it with the current horizontal offset
    const totalAngle = playerRotation + this.horizontalAngle;
    
    // Create direction vector
    const direction = new THREE.Vector3(
      Math.sin(totalAngle),
      0,
      Math.cos(totalAngle)
    );
    
    return direction.normalize();
  }
  
  // Reset camera angles
  resetAngles() {
    // Reset the horizontal angle to zero
    // This is important when switching camera modes
    this.horizontalAngle = 0;
    
    // Keep the current vertical angle as it's comfortable for the player
    // Don't reset distance as player may have adjusted it to their preference
  }
}