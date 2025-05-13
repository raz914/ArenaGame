# Arena Game 3D Engine

This is a 3D third-person game engine built with Three.js, featuring character animation, movement controls, and camera management.

## Architecture

The codebase follows an Object-Oriented Programming (OOP) approach, splitting functionality into several specialized classes:

### Core Classes

- **ArenaGame** - Main coordinator that initializes and connects all components
- **SceneManager** - Manages the Three.js scene, renderer, camera, and rendering loop
- **ModelLoader** - Handles loading and setup of 3D models, textures, and animations

### Controller Classes

- **InputController** - Manages keyboard input and key mapping
- **CharacterController** - Handles character movement, position, rotation, and special actions
- **AnimationStateController** - Manages animation states and transitions based on character actions
- **UIManager** - Handles on-screen instructions and user interface elements
- **DebugController** - Provides debugging tools and functionality

### Camera Management

- **FollowCamera** - A specialized camera that follows the character with customizable offset and angles

## Class Relationships

- **ArenaGame** initializes and coordinates all controllers
- **InputController** provides input state to other controllers
- **CharacterController** uses InputController to determine movement, and updates ModelLoader with new positions
- **AnimationStateController** uses both InputController and CharacterController to determine which animations to play
- **UIManager** provides user feedback and instructions
- **DebugController** connects to AnimationStateController for animation debugging and to UIManager for debug messages

## Movement System

The game supports:
- Forward/backward movement
- Strafing left/right
- Diagonal movement
- Running (with Shift)
- Turning left/right
- 180-degree quick turn
- Jumping
- Crouching
- Victory pose

## Animation System

Animations are managed through a state system that automatically transitions between animations based on player input and character state. The system supports:

- Standing/walking/running animations
- Strafing animations
- Turn animations
- Jump animations
- Victory animation
- Crouching animations

## Camera System

The FollowCamera supports two modes:
- Follow Mode - Camera follows the character's rotation
- Free Mode - Camera can rotate independently of the character's rotation

## Expanding the Game

To add new features:
1. For new environment objects, add them to the SceneManager scene
2. For new animations, add them to the AnimationStateController
3. For new character behaviors, extend the CharacterController
4. For new input controls, update the InputController

## Future Enhancements

- Environmental objects and buildings
- Collision detection
- NPC characters
- Interaction system
- Combat system 