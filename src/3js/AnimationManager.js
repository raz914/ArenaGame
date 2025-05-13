import * as THREE from 'three';

export class AnimationManager {
  constructor() {
    // Animation mixer
    this.mixer = null;
    
    // Animation clips and references
    this.animations = null;
    this.animationActions = {};
    
    // Animation state tracking
    this.currentState = 'Idle';
    this.previousState = null;
    this.activeAction = null;
    this.previousAction = null;
    
    // Animation states mapping
    this.animationStates = {
      'IDLE': "Idle",
      'TURN_LEFT_IDLE': "90-degree turn left",
      'TURN_RIGHT_IDLE': "90-degree turn right",
      'TURN_180_WALK': "180-degree turn",
      'RUN_FORWARD': "Run",
      'RUN_BACK': "Backward guarding run",
      'STRAFE_LEFT_RUN': "Leftward guarding run",
      'STRAFE_RIGHT_RUN': "Rightward guarding run",
      'WALK_FORWARD': "Forward guard walk",
      'WALK_BACK': "Forward guarding walk",
      'STRAFE_LEFT_WALK': "Leftward guarding walk",
      'STRAFE_RIGHT_WALK': "Rightward guarding walk",
      // Additional animations
      'ATTACK': "Attack",
      'ATTACK_1': "Attack 1",
      'JUMP': "Jump",
      'JUMP_1': "Jump 1",
      'JUMP_ATTACK': "Jumping Attack",
      'CROUCH': "Crouching",
      'CROUCH_IDLE': "Crouching idle",
      'CROUCH_ATTACK': "Crouching attack",
      'DAMAGE': "Getting Damage",
      'DEATH_BACKWARD': "Death backward",
      'DEATH_FORWARD': "Death forward",
      'VICTORY': "Victory pose",
      'WAR_SCREAM': "War Scream"
    };
  }

  // Initialize animations from loaded model
  setupAnimations(model, animations) {
    if (!model || !animations || animations.length === 0) {
      console.warn('No model or animations provided to AnimationManager');
      return false;
    }

    // Log available animations
    console.log('Available animations:', animations.map(a => a.name).join(', '));
    
    // Create the animation mixer
    this.mixer = new THREE.AnimationMixer(model);
    this.animations = animations;
    
    // Create animation actions for all animations
    this.setupAnimationActions();
    
    // Start with idle animation
    this.setState('IDLE');
    
    return true;
  }

  // Create animation actions from animation clips
  setupAnimationActions() {
    // Create action for each animation based on the mapping
    Object.entries(this.animationStates).forEach(([state, animName]) => {
      const animation = this.animations.find(clip => clip.name === animName);
      
      if (animation) {
        // Create the action
        const action = this.mixer.clipAction(animation);
        
        // Configure the action
        action.clampWhenFinished = false;
        action.loop = THREE.LoopRepeat;
        
        // Store the action
        this.animationActions[state] = action;
      } else {
        console.warn(`Animation "${animName}" for state "${state}" not found`);
      }
    });
    
    console.log('Animation actions created:', Object.keys(this.animationActions));
  }

  // Update animations with delta time
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  // Set animation state with smooth transitions
  setState(newState) {
    // If this state is already active, do nothing
    if (newState === this.currentState) {
      return false;
    }
    
    console.log(`Changing animation state from ${this.currentState} to ${newState}`);
    
    // Get the action for the new state
    const nextAction = this.animationActions[newState];
    
    if (!nextAction) {
      console.warn(`No action found for state: ${newState}`);
      return false;
    }
    
    // Store the current action as previous action
    this.previousAction = this.activeAction;
    this.previousState = this.currentState;
    
    // Update current state and action
    this.currentState = newState;
    this.activeAction = nextAction;
    
    // If there is no previous action, just play the new action
    if (!this.previousAction) {
      this.activeAction.reset();
      this.activeAction.play();
      return true;
    }
    
    // Crossfade from previous to new action
    const fadeDuration = 0.2; // Adjust this for faster/slower transitions
    
    // Make sure the new action is enabled and weighted properly
    this.activeAction.reset();
    this.activeAction.setEffectiveTimeScale(1);
    this.activeAction.setEffectiveWeight(1);
    
    // Crossfade from current to new action
    this.previousAction.crossFadeTo(this.activeAction, fadeDuration, true);
    
    // Play the new action
    this.activeAction.play();
    
    return true;
  }

  // Get current animation state
  getCurrentState() {
    return this.currentState;
  }

  // Reset animations when changing character model
  resetAnimations() {
    this.mixer = null;
    this.animations = null;
    this.animationActions = {};
    this.activeAction = null;
    this.previousAction = null;
    this.currentState = 'IDLE';
    this.previousState = null;
  }
} 