// Interactive Building Editor
// This script lets you select and position buildings interactively using keyboard controls

console.log("Building Editor script loaded");

// Make BuildingEditor class globally accessible
window.BuildingEditor = class BuildingEditor {
  constructor(game) {
    console.log("BuildingEditor constructor called");
    this.game = game;
    this.selectedBuildingId = null;
    this.allBuildingIds = [];
    this.currentIndex = 0;
    this.moveSpeed = 1;       // Units per keystroke
    this.rotateSpeed = 0.1;   // Radians per keystroke
    this.scaleSpeed = 0.1;    // Scale change per keystroke
    this.isActive = false;
    
    // UI elements
    this.uiOverlay = null;
    this.buildingNameElement = null;
    this.positionElement = null;
    this.rotationElement = null;
    this.scaleElement = null;
    this.controlsElement = null;
    
    // Listener reference for cleanup
    this.keyDownHandler = null;
  }
  
  initialize() {
    console.log("BuildingEditor.initialize() called");
    // Get all building IDs
    this.allBuildingIds = this.game.environmentManager.getBuildingIds();
    console.log("Found buildings:", this.allBuildingIds);
    
    if (this.allBuildingIds.length === 0) {
      console.error('No buildings found. Wait for buildings to load or check paths.');
      return;
    }
    
    // Select first building
    this.selectBuilding(0);
    
    // Create UI overlay
    this.createUI();
    
    // Add keyboard handler
    this.keyDownHandler = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.keyDownHandler);
    console.log("Keyboard handler attached for building editor");
    
    // Mark as active
    this.isActive = true;
    console.log('Building Editor activated. Press B to toggle editor UI.');
  }
  
  createUI() {
    // Create editor UI overlay
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.id = 'building-editor-overlay';
    this.uiOverlay.style.position = 'fixed';
    this.uiOverlay.style.top = '10px';
    this.uiOverlay.style.right = '10px';
    this.uiOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.uiOverlay.style.color = 'white';
    this.uiOverlay.style.padding = '10px';
    this.uiOverlay.style.borderRadius = '5px';
    this.uiOverlay.style.fontFamily = 'monospace';
    this.uiOverlay.style.zIndex = '1000';
    this.uiOverlay.style.width = '300px';
    this.uiOverlay.style.display = 'none'; // Hidden by default
    
    // Create UI elements
    this.buildingNameElement = document.createElement('div');
    this.buildingNameElement.style.fontWeight = 'bold';
    this.buildingNameElement.style.fontSize = '16px';
    this.buildingNameElement.style.marginBottom = '10px';
    
    this.positionElement = document.createElement('div');
    this.rotationElement = document.createElement('div');
    this.scaleElement = document.createElement('div');
    
    this.controlsElement = document.createElement('div');
    this.controlsElement.style.marginTop = '10px';
    this.controlsElement.style.fontSize = '12px';
    this.controlsElement.innerHTML = `
      <div style="margin-bottom: 5px;">Controls:</div>
      <div>7 - Next building</div>
      <div>Tab/Shift+Tab - Previous/Next building (alternative)</div>
      <div>Numpad 8/2/4/6 - Move Z/X</div>
      <div>Numpad 9/3 - Move Y up/down</div>
      <div>J/L - Rotate Y (changed from Q/E)</div>
      <div>I/K - Rotate X (changed from R/F)</div>
      <div>U/O - Rotate Z (changed from T/G)</div>
      <div>+/- - Scale</div>
      <div>S - Save positions to console</div>
      <div>B - Toggle UI (changed from E)</div>
    `;
    
    // Add elements to overlay
    this.uiOverlay.appendChild(this.buildingNameElement);
    this.uiOverlay.appendChild(this.positionElement);
    this.uiOverlay.appendChild(this.rotationElement);
    this.uiOverlay.appendChild(this.scaleElement);
    this.uiOverlay.appendChild(this.controlsElement);
    
    // Add to document
    document.body.appendChild(this.uiOverlay);
    
    // Update UI
    this.updateUI();
  }
  
  selectBuilding(index) {
    // Handle array bounds
    if (index < 0) index = this.allBuildingIds.length - 1;
    if (index >= this.allBuildingIds.length) index = 0;
    
    this.currentIndex = index;
    this.selectedBuildingId = this.allBuildingIds[index];
    
    // Check if building exists
    const building = this.game.environmentManager.getBuilding(this.selectedBuildingId);
    if (!building) {
      console.warn(`Building ${this.selectedBuildingId} not found`);
      this.selectBuilding(index + 1);
      return;
    }
    
    // Highlight the selected building (optional - you could add a temporary visual indicator)
    console.log(`Selected building: ${this.selectedBuildingId}`);
    
    // Update UI
    this.updateUI();
  }
  
  updateUI() {
    if (!this.uiOverlay || !this.selectedBuildingId) return;
    
    const building = this.game.environmentManager.getBuilding(this.selectedBuildingId);
    if (!building) return;
    
    // Update building info
    this.buildingNameElement.textContent = `Building: ${this.selectedBuildingId} (${this.currentIndex + 1}/${this.allBuildingIds.length})`;
    
    // Update position
    this.positionElement.textContent = `Position: X: ${building.position.x.toFixed(2)}, Y: ${building.position.y.toFixed(2)}, Z: ${building.position.z.toFixed(2)}`;
    
    // Update rotation (convert to degrees for display)
    this.rotationElement.textContent = `Rotation: X: ${(building.rotation.x * 180 / Math.PI).toFixed(2)}°, Y: ${(building.rotation.y * 180 / Math.PI).toFixed(2)}°, Z: ${(building.rotation.z * 180 / Math.PI).toFixed(2)}°`;
    
    // Update scale
    this.scaleElement.textContent = `Scale: X: ${building.scale.x.toFixed(2)}, Y: ${building.scale.y.toFixed(2)}, Z: ${building.scale.z.toFixed(2)}`;
  }
  
  toggleUI() {
    if (this.uiOverlay) {
      this.uiOverlay.style.display = this.uiOverlay.style.display === 'none' ? 'block' : 'none';
      console.log(`UI visibility toggled: ${this.uiOverlay.style.display === 'block' ? 'visible' : 'hidden'}`);
    }
  }
  
  handleKeyDown(event) {
    // Only process if editor is active
    if (!this.isActive || !this.selectedBuildingId) {
      console.log("Editor is not active or no building selected. Not handling key:", event.key);
      return;
    }
    
    console.log(`Building Editor key detected: ${event.key} (code: ${event.code})`);
    
    // Toggle UI visibility - changed from E to B to avoid conflict
    if (event.key === 'b' || event.key === 'B') {
      console.log("B key pressed. Toggling UI");
      this.toggleUI();
      return;
    }
    
    const building = this.game.environmentManager.getBuilding(this.selectedBuildingId);
    if (!building) {
      console.warn(`Building with ID ${this.selectedBuildingId} not found. Cannot manipulate.`);
      return;
    }
    
    let updateNeeded = true;
    
    // Navigation between buildings - Using 7 on numpad or number row
    if (event.key === '7' || event.code === 'Digit7' || event.code === 'Numpad7') {
      console.log("7 key pressed. Selecting next building");
      this.selectBuilding(this.currentIndex + 1); // Next building
      return;
    }
    
    // Keep Tab navigation as alternative
    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent focus change
      if (event.shiftKey) {
        console.log("Shift+Tab pressed. Selecting previous building");
        this.selectBuilding(this.currentIndex - 1); // Previous building
      } else {
        console.log("Tab pressed. Selecting next building");
        this.selectBuilding(this.currentIndex + 1); // Next building
      }
      return;
    }
    
    // Position controls using numpad
    switch (event.key) {
      // Numpad controls
      case 'Numpad4':
      case '4':
        console.log("Moving left (X-)");
        building.position.x -= this.moveSpeed;
        break;
      case 'Numpad6':
      case '6':
        console.log("Moving right (X+)");
        building.position.x += this.moveSpeed;
        break;
      case 'Numpad8':
      case '8':
        console.log("Moving forward (Z-)");
        building.position.z -= this.moveSpeed;
        break;
      case 'Numpad2':
      case '2':
        console.log("Moving backward (Z+)");
        building.position.z += this.moveSpeed;
        break;
      case 'Numpad9':
      case '9':
        console.log("Moving up (Y+)");
        building.position.y += this.moveSpeed;
        break;
      case 'Numpad3':
      case '3':
        console.log("Moving down (Y-)");
        building.position.y -= this.moveSpeed;
        break;
        
      // Keep arrow keys as alternative
      case 'ArrowLeft':
        console.log("Arrow Left - Moving left (X-)");
        building.position.x -= this.moveSpeed;
        break;
      case 'ArrowRight':
        console.log("Arrow Right - Moving right (X+)");
        building.position.x += this.moveSpeed;
        break;
      case 'ArrowUp':
        console.log("Arrow Up - Moving forward (Z-)");
        building.position.z -= this.moveSpeed;
        break;
      case 'ArrowDown':
        console.log("Arrow Down - Moving backward (Z+)");
        building.position.z += this.moveSpeed;
        break;
      case 'PageUp':
        console.log("Page Up - Moving up (Y+)");
        building.position.y += this.moveSpeed;
        break;
      case 'PageDown':
        console.log("Page Down - Moving down (Y-)");
        building.position.y -= this.moveSpeed;
        break;
        
      // Rotation controls - changed to avoid conflicts with WASD movement
      case 'j':
      case 'J':
        console.log("Rotating Y-");
        building.rotation.y -= this.rotateSpeed;
        break;
      case 'l':
      case 'L':
        console.log("Rotating Y+");
        building.rotation.y += this.rotateSpeed;
        break;
      case 'i':
      case 'I':
        console.log("Rotating X+");
        building.rotation.x += this.rotateSpeed;
        break;
      case 'k':
      case 'K':
        console.log("Rotating X-");
        building.rotation.x -= this.rotateSpeed;
        break;
      case 'u':
      case 'U':
        console.log("Rotating Z+");
        building.rotation.z += this.rotateSpeed;
        break;
      case 'o':
      case 'O':
        console.log("Rotating Z-");
        building.rotation.z -= this.rotateSpeed;
        break;
        
      // Scale controls
      case '+':
      case '=': // Since + is Shift+=
        console.log("Scaling up");
        building.scale.x += this.scaleSpeed;
        building.scale.y += this.scaleSpeed;
        building.scale.z += this.scaleSpeed;
        break;
      case '-':
        console.log("Scaling down");
        building.scale.x = Math.max(0.1, building.scale.x - this.scaleSpeed);
        building.scale.y = Math.max(0.1, building.scale.y - this.scaleSpeed);
        building.scale.z = Math.max(0.1, building.scale.z - this.scaleSpeed);
        break;
        
      // Print current positions to console
      case 's':
      case 'S':
        console.log("Saving layout to console");
        this.printPositionsToConsole();
        break;
        
      default:
        updateNeeded = false;
    }
    
    // Update UI if needed
    if (updateNeeded) {
      console.log(`Building ${this.selectedBuildingId} updated:`, {
        position: building.position,
        rotation: building.rotation,
        scale: building.scale
      });
      this.updateUI();
    }
  }
  
  printPositionsToConsole() {
    console.log('// Current building positions:');
    console.log('// Copy and paste this code to reproduce the current layout');
    console.log('function setupBuildingLayout(game) {');
    
    this.allBuildingIds.forEach(id => {
      const building = this.game.environmentManager.getBuilding(id);
      if (building) {
        console.log(`  game.environmentManager.setPosition('${id}', ${building.position.x.toFixed(2)}, ${building.position.y.toFixed(2)}, ${building.position.z.toFixed(2)});`);
        console.log(`  game.environmentManager.setRotation('${id}', ${building.rotation.x.toFixed(4)}, ${building.rotation.y.toFixed(4)}, ${building.rotation.z.toFixed(4)});`);
        console.log(`  game.environmentManager.setScale('${id}', ${building.scale.x.toFixed(2)}, ${building.scale.y.toFixed(2)}, ${building.scale.z.toFixed(2)});`);
      }
    });
    
    console.log('}');
    console.log('// End of building layout');
  }
  
  cleanup() {
    // Remove event listener
    if (this.keyDownHandler) {
      document.removeEventListener('keydown', this.keyDownHandler);
    }
    
    // Remove UI
    if (this.uiOverlay && this.uiOverlay.parentNode) {
      this.uiOverlay.parentNode.removeChild(this.uiOverlay);
    }
    
    this.isActive = false;
    console.log('Building Editor deactivated');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded in building-editor.js");
  // Wait for buildings to load
  setTimeout(() => {
    console.log("Initializing BuildingEditor...");
    if (!window.game) {
      console.error("Game object not found on window. Cannot initialize editor.");
      return;
    }
    
    if (!window.game.environmentManager) {
      console.error("EnvironmentManager not found on game object. Cannot initialize editor.");
      return;
    }
    
    // Create and initialize the building editor
    const editor = new window.BuildingEditor(window.game);
    editor.initialize();
    
    // Make editor available globally for console access
    window.buildingEditor = editor;
    console.log("BuildingEditor initialized and available at window.buildingEditor");
  }, 5000);
}); 