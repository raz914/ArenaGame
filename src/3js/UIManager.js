export class UIManager {
  constructor() {
    this.instructionsElement = null;
    this.alignStatusElement = null;
    this.controlsVisible = true; // Track visibility of controls
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
    instructions.id = 'controls-panel'; // Add an ID for easier access
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
        <li>T: Toggle camera mode <span id="align-status">FOLLOW</span></li>
        <li><strong>Click</strong> to lock mouse (360° rotation)</li>
        <li>Press <strong>ESC</strong> to release mouse lock</li>
        <li>H: Toggle controls visibility</li>
      </ul>
    `;
    document.body.appendChild(instructions);
    
    this.instructionsElement = instructions;
    this.alignStatusElement = document.getElementById('align-status');
  }
  
  // Toggle the visibility of the controls panel
  toggleControlsVisibility() {
    if (this.instructionsElement) {
      this.controlsVisible = !this.controlsVisible;
      this.instructionsElement.style.display = this.controlsVisible ? 'block' : 'none';
      return this.controlsVisible;
    }
    return false;
  }
  
  // Hide controls panel
  hideControls() {
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'none';
      this.controlsVisible = false;
    }
  }
  
  // Show controls panel
  showControls() {
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'block';
      this.controlsVisible = true;
    }
  }
  
  // Update camera alignment status in the UI
  updateAlignmentStatus(isAligned) {
    if (this.alignStatusElement) {
      this.alignStatusElement.textContent = isAligned ? 'FREE' : 'FOLLOW';
    }
  }
  
  // Add a debug message to the UI
  showDebugMessage(message) {
    // Create a debug message element if it doesn't exist
    if (!this.debugElement) {
      const debugElement = document.createElement('div');
      debugElement.style.position = 'absolute';
      debugElement.style.bottom = '10px';
      debugElement.style.right = '10px';
      debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      debugElement.style.color = 'white';
      debugElement.style.padding = '10px';
      debugElement.style.borderRadius = '5px';
      debugElement.style.fontFamily = 'Arial, sans-serif';
      debugElement.style.fontSize = '14px';
      debugElement.style.zIndex = '1000';
      
      document.body.appendChild(debugElement);
      this.debugElement = debugElement;
    }
    
    // Update the debug message
    this.debugElement.textContent = message;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.debugElement.textContent = '';
    }, 3000);
  }
} 