export class InputController {
  constructor() {
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
      alignToggle: false,
      toggleControls: false // New key for controlling visibility
    };
    
    // Track the last time certain keys were pressed to prevent rapid triggering
    this.lastKeyPressTime = {
      jump: 0,
      turn180: 0,
      victory: 0,
      toggleControls: 0
    };
    
    // Minimum time between actions (in milliseconds)
    this.actionCooldown = 300;
    
    // Set up the event listeners
    this.setupKeyboardListeners();
  }
  
  setupKeyboardListeners() {
    // Add keydown event listener
    window.addEventListener('keydown', (event) => {
      // Prevent default behavior for game control keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 
           'shift', 'control', 'q', 'e', 'r', ' ', 'v', 't', 'h'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
      
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
          // Simply set turnLeft to true (keep pressed until released)
          this.keys.turnLeft = true;
          break;
        case 'e':
          // Simply set turnRight to true (keep pressed until released)
          this.keys.turnRight = true;
          break;
        case 'r':
          this.handleActionKey('turn180');
          break;
        case ' ': // Space key for jump
          this.handleActionKey('jump');
          break;
        case 'v': // V key for victory pose
          this.handleActionKey('victory');
          break;
        case 't':
          // Toggle camera alignment only on key press, not hold
          if (!this.keys.alignToggle) {
            this.keys.alignToggle = true;
          }
          break;
        case 'h':
          // Toggle controls visibility
          this.handleActionKey('toggleControls');
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
          break;
        case 'e':
          this.keys.turnRight = false;
          break;
        case 'r':
          this.keys.turn180 = false;
          break;
        case ' ': // Space key for jump
          this.keys.jump = false;
          break;
        case 'v': // V key for victory pose
          this.keys.victory = false;
          break;
        case 't':
          this.keys.alignToggle = false;
          break;
        case 'h':
          this.keys.toggleControls = false;
          break;
      }
    });
    
    // Handle lost focus - reset all keys when the window loses focus
    window.addEventListener('blur', () => {
      this.resetAllKeys();
    });
  }
  
  // Reset all key states
  resetAllKeys() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }
  
  // Handle action keys with cooldown
  handleActionKey(actionType) {
    const now = Date.now();
    const lastPress = this.lastKeyPressTime[actionType] || 0;
    
    // Check if enough time has passed since the last press
    if (now - lastPress > this.actionCooldown) {
      // Set the key state
      this.keys[actionType] = true;
      
      // Update the last press time
      this.lastKeyPressTime[actionType] = now;
    }
  }
  
  // Method to add debug controls
  setupDebugControls(callback) {
    window.addEventListener('keydown', (event) => {
      // Debug controls only work when holding Shift
      if (!event.shiftKey) return;
      
      // Call the provided callback with the key event
      if (callback) {
        callback(event);
      }
    });
  }
  
  // Check if key actions conflict, and resolve them
  resolveKeyConflicts() {
    // Cannot move forward and backward at the same time
    if (this.keys.forward && this.keys.backward) {
      // Prioritize the most recently pressed key
      if (this.lastKeyPressTime.forward > this.lastKeyPressTime.backward) {
        this.keys.backward = false;
      } else {
        this.keys.forward = false;
      }
    }
    
    // Cannot turn left and right at the same time
    if (this.keys.turnLeft && this.keys.turnRight) {
      // Cancel both to prevent weird behavior
      this.keys.turnLeft = false;
      this.keys.turnRight = false;
    }
  }
} 