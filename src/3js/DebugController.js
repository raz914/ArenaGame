export class DebugController {
  constructor(animationStateController, uiManager) {
    this.animationStateController = animationStateController;
    this.uiManager = uiManager;
    this.isDebugMode = false;
  }
  
  // Toggle debug mode
  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    console.log(`Debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
    
    if (this.uiManager) {
      this.uiManager.showDebugMessage(`Debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
    }
    
    return this.isDebugMode;
  }
  
  // Handle debug key events
  handleDebugKeyEvent(event) {
    if (!this.isDebugMode) return false;
    
    switch(event.key.toLowerCase()) {
      case 'n':
      case 'p':
      case 'r':
      case 'i':
      case 'l':
        // Forward animation debug commands to the animation controller
        if (this.animationStateController) {
          this.animationStateController.handleDebugKeyEvent(event);
        }
        return true;
      
      case 'd':
        // Print debug information
        this.printDebugInfo();
        return true;
        
      case 'c':
        // Clear console
        console.clear();
        return true;
        
      case 'm':
        // Show available animations
        this.showAvailableAnimations();
        return true;
        
      default:
        return false;
    }
  }
  
  // Print debug information
  printDebugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('Debug mode:', this.isDebugMode);
    
    if (this.animationStateController) {
      console.log('Current animation state:', this.animationStateController.getCurrentAnimationState());
      this.animationStateController.checkAnimations();
    }
    
    console.log('=================');
  }
  
  // Show available animations
  showAvailableAnimations() {
    if (this.animationStateController) {
      const animations = this.animationStateController.getAvailableAnimations();
      console.log('Available animations:', animations);
      
      if (this.uiManager) {
        this.uiManager.showDebugMessage(`${animations.length} animations available. Check console for details.`);
      }
    }
  }
  
  // Initialize debug controls
  setupDebugControls(inputController) {
    if (inputController) {
      // Set up debug keyboard listener using the InputController
      inputController.setupDebugControls((event) => this.handleDebugKeyEvent(event));
    }
  }
} 