// Enhanced ModelLoader with animation state management based on your previous implementation

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AnimationManager } from './AnimationManager.js';

export class ModelLoader {
  constructor(scene, updateCameraCallback) {
    this.scene = scene;
    this.updateCameraCallback = updateCameraCallback;
    this.modelPath = "./assets/models/ground.glb"; // Default ground model path
    this.characterPath = "./assets/models/ee.glb"; // Default character model path
    
    // Model-related properties
    this.model = null;
    this.character = null;
    this.isModelLoaded = false;
    this.isCharacterLoaded = false;
    this.loadingManager = null;
    this.loaderOverlay = null;
    this.loaderPercentage = null;
    this.progressBar = null;
    
    // Create the animation manager
    this.animationManager = new AnimationManager();
    
    // Create GLTF and Draco loaders
    this.gltfLoader = null;
    this.dracoLoader = null;
    this.setupLoaders();
    
    console.log("ModelLoader initialized with model path:", this.modelPath);
    
    // Ensure loader is visible during model loading
    this.setupLoader();
    
    // Load the ground model
    this.loadModel();
  }
  
  setupLoaders() {
    // Create loading manager for progress tracking
    this.loadingManager = new THREE.LoadingManager();
    
    // Setup loading manager callbacks
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percentComplete = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${percentComplete.toFixed(0)}%`);
      this.updateLoaderProgress(percentComplete);
      
      // Dispatch custom event for any other listeners
      const event = new CustomEvent('modelLoadProgress', { 
        detail: { progress: percentComplete } 
      });
      window.dispatchEvent(event);
    };
    
    this.loadingManager.onLoad = () => {
      console.log('Loading complete!');
      
      // Hide loader with a fade out effect
      if (this.loaderOverlay) {
        this.loaderOverlay.style.opacity = '0';
        setTimeout(() => {
          this.loaderOverlay.style.display = 'none';
        }, 500); // Match this to your CSS transition time
      }
      
      this.isModelLoaded = true;
    };
    
    this.loadingManager.onError = (url) => {
      console.error('Error loading resource:', url);
      
      // Update loader to show error
      if (this.loaderPercentage) {
        this.loaderPercentage.textContent = 'Error loading model';
        this.loaderPercentage.style.color = 'red';
      }
      
      // Update loader text to show error
      const loaderText = document.querySelector('.loader-text');
      if (loaderText) {
        loaderText.textContent = 'Error loading model';
        loaderText.style.color = 'red';
      }
    };
    
    // Create GLTF loader
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    
    // Setup Draco compression support
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }
  
  setupLoader() {
    // Create loader overlay
    this.createLoaderOverlay();
    
    // Get loader elements
    this.loaderOverlay = document.getElementById('loader-overlay');
    this.loaderPercentage = document.getElementById('loader-percentage');
    this.progressBar = document.getElementById('progress-bar');
    
    // Make sure loader is visible
    if (this.loaderOverlay) {
      this.loaderOverlay.style.display = 'flex';
      this.loaderOverlay.style.opacity = '1';
    }
  }
  
  createLoaderOverlay() {
    // Check if loader already exists (user might have it in their HTML)
    if (document.getElementById('loader-overlay')) {
      return;
    }
    
    // Create loader overlay container
    const overlay = document.createElement('div');
    overlay.id = 'loader-overlay';
    overlay.className = 'loader-overlay';
    
    // Create loader grid animation
    const loader = document.createElement('div');
    loader.className = 'loader';
    for (let i = 0; i < 6; i++) {
      const span = document.createElement('span');
      loader.appendChild(span);
    }
    overlay.appendChild(loader);
    
    // Create percentage text
    const percentage = document.createElement('div');
    percentage.id = 'loader-percentage';
    percentage.className = 'loader-percentage';
    percentage.textContent = '0%';
    overlay.appendChild(percentage);
    
    // Create loading text
    const loaderText = document.createElement('div');
    loaderText.className = 'loader-text';
    loaderText.textContent = 'Preparing to load Model...';
    overlay.appendChild(loaderText);
    
    // Create loader tip
    const loaderTip = document.createElement('div');
    loaderTip.className = 'loader-tip';
    loaderTip.textContent = 'Large 3D model - this may take a moment';
    overlay.appendChild(loaderTip);
    
    // Create progress container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    overlay.appendChild(progressContainer);
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.className = 'progress-bar';
    progressContainer.appendChild(progressBar);
    
    // Add to document
    document.body.appendChild(overlay);
  }
  
  updateLoaderProgress(progress) {
    // Update loader percentage text
    if (this.loaderPercentage) {
      this.loaderPercentage.textContent = `${Math.round(progress)}%`;
    }
    
    // Update progress bar width
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    
    // Update loader text if it exists
    const loaderText = document.querySelector('.loader-text');
    if (loaderText) {
      loaderText.textContent = `Loading Model... ${Math.round(progress)}%`;
    }
  }
  
  loadModel() {
    // Create a textured ground plane instead of loading a 3D model
    // Load textures first
    const textureLoader = new THREE.TextureLoader();
    
    // Add a console.log to check when texture loading starts
    console.log("Starting to load ground texture");
    
    // Create a procedural texture (checkerboard) that's definitely visible
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const stride = (i * size + j) * 4;
        
        // Create a checkerboard pattern
        const isCheckerboard = ((i & 32) === 0) !== ((j & 32) === 0);
        
        // Set RGBA values
        data[stride] = isCheckerboard ? 200 : 150;     // R
        data[stride + 1] = isCheckerboard ? 180 : 120; // G
        data[stride + 2] = isCheckerboard ? 150 : 100; // B
        data[stride + 3] = 255;                        // A (fully opaque)
      }
    }
    
    // Create the texture from data
    const procedualTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    procedualTexture.wrapS = THREE.RepeatWrapping;
    procedualTexture.wrapT = THREE.RepeatWrapping;
    procedualTexture.repeat.set(4, 4);
    procedualTexture.needsUpdate = true;
    
    // Try different path formats
    const texturePath = 'public/assets/textures/tex_ground.jpg'; // Try with public prefix
    console.log("Attempting to load texture from:", texturePath);
    
    // Use absolute path to ensure textures are found
    const groundTexture = textureLoader.load(texturePath, 
      // Success callback
      (texture) => {
        console.log("Ground texture loaded successfully");
        // Set texture properties for better quality and visibility
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Reduced repeat for higher resolution
        texture.anisotropy = 16; // Improve texture sharpness
        
        // Update material after texture is loaded to ensure it's applied
        if (this.model && this.model.material) {
          this.model.material.needsUpdate = true;
        }
      },
      // Progress callback
      undefined,
      // Error callback
      (error) => {
        console.error("Error loading ground texture:", error);
      }
    );
    
    // Create a plane geometry for the ground
    const groundSize = 150; // Large ground size
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    
    // Create material with the textures
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: procedualTexture, // Use our procedural texture instead
      color: 0xccbb99, // Tan/sand color as base
      roughness: 0.8,
      metalness: 0.2
    });
    
    // In case texture fails to load, set a visible pattern
    groundMaterial.onBeforeCompile = function(shader) {
      console.log("Material compilation started");
    };
    
    // Create the ground mesh
    this.model = new THREE.Mesh(groundGeometry, groundMaterial);
    
    // Rotate the plane to be horizontal (by default PlaneGeometry is vertical)
    this.model.rotation.x = -Math.PI / 2;
    
    // Enable shadows for the ground
    this.model.receiveShadow = true;
    
    // Add the ground plane to the scene
    this.scene.add(this.model);
    
    // Add a grid helper to make the ground more visible
    const gridHelper = new THREE.GridHelper(100, 20, 0xff0000, 0x0000ff);
    gridHelper.position.y = 0.01; // Raise slightly above the ground to prevent z-fighting
    // this.scene.add(gridHelper);
    
    // Add a spotlight aimed at the ground to highlight the texture
    const spotlight = new THREE.SpotLight(0xffffff, 1.5);
    spotlight.position.set(0, 30, 0);
    spotlight.target = this.model;
    spotlight.angle = Math.PI / 4;
    spotlight.penumbra = 0.1;
    spotlight.decay = 1;
    spotlight.distance = 100;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    this.scene.add(spotlight);
    
    console.log("Created textured ground plane");
    
    // Try to load the real texture in the background
    // Try multiple texture paths in sequence
    const possiblePaths = [
      './assets/textures/tex_ground.jpg',
      '/assets/textures/tex_ground.jpg',
      'public/assets/textures/tex_ground.jpg',
      '../public/assets/textures/tex_ground.jpg',
      'assets/textures/tex_ground.jpg'
    ];
    
    // Try loading each path
    this.tryLoadingTextures(possiblePaths, (loadedTexture) => {
      console.log("Successfully loaded texture!");
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.RepeatWrapping;
      loadedTexture.repeat.set(4, 4);
      
      // Update the material with the successfully loaded texture
      this.model.material.map = loadedTexture;
      this.model.material.needsUpdate = true;
    });
    
    // Now load the character model
    this.loadCharacter();
  }
  
  // Helper method to try loading textures from multiple paths
  tryLoadingTextures(paths, onSuccess) {
    if (paths.length === 0) {
      console.warn("All texture paths failed to load");
      return;
    }
    
    const path = paths[0];
    console.log(`Trying texture path: ${path}`);
    
    new THREE.TextureLoader().load(
      path,
      (texture) => {
        console.log(`Successfully loaded texture from: ${path}`);
        if (onSuccess) onSuccess(texture);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load texture from ${path}:`, error);
        // Try next path
        this.tryLoadingTextures(paths.slice(1), onSuccess);
      }
    );
  }
  
  loadCharacter() {
    // Load the character model
    this.gltfLoader.load(
      this.characterPath,
      (gltf) => {
        // Store the character
        this.character = gltf.scene;
        
        // Position character slightly above ground
        this.character.position.set(0, 0, 0);
        
        // Enable shadows for all meshes in the character model
        this.character.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Improve material quality
            if (node.material) {
              node.material.roughness = Math.max(0.4, node.material.roughness || 0.5);
              node.material.metalness = Math.min(0.8, node.material.metalness || 0.2);
              
              // Improve texture quality if present
              if (node.material.map) {
                node.material.map.anisotropy = 16;
              }
            }
          }
        });
        
        // Add the character to the scene
        this.scene.add(this.character);
        
        // Setup animation mixer and actions
        if (gltf.animations && gltf.animations.length > 0) {
          // Initialize animations using the animation manager
          this.animationManager.setupAnimations(this.character, gltf.animations);
        }
        
        console.log('Character model loaded successfully');
        this.isCharacterLoaded = true;
      },
      (xhr) => {
        // Progress is handled by the loading manager
      },
      (error) => {
        console.error('An error occurred loading the character model:', error);
      }
    );
  }
  
  processModel(gltf) {
    // Get the model scene
    const model = gltf.scene;
    
    // Calculate the bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Center the model
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    
    // Scale model to reasonable size if needed
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 10) {
      const scale = 5 / maxDim; // Scale to fit in a 5x5x5 box
      model.scale.set(scale, scale, scale);
    }
    
    // Update camera via callback
    if (this.updateCameraCallback) {
      this.updateCameraCallback(center, size);
    }
    
    // Enable shadows for all meshes
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Improve material quality if needed
        if (node.material) {
          // Ensure materials use physically correct lighting
          node.material.roughness = Math.max(0.4, node.material.roughness || 0.5);
          
          // If model has low-res textures, limit anisotropy to improve appearance
          if (node.material.map) {
            node.material.map.anisotropy = 4;
          }
        }
      }
    });
  }
  
  // Method to update animations
  updateAnimations(deltaTime) {
    // Update animations via animation manager
    this.animationManager.update(deltaTime);
  }
  
  // Method to play a specific character animation
  playCharacterAnimation(animationName) {
    return this.animationManager.setState(animationName);
  }
  
  // Method to change the model
  setModelPath(newPath) {
    this.modelPath = newPath;
    
    // Remove old model if it exists
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }
    
    // Reset loading state
    this.isModelLoaded = false;
    
    // Make loader visible again
    if (this.loaderOverlay) {
      this.loaderOverlay.style.display = 'flex';
      this.loaderOverlay.style.opacity = '1';
    }
    
    // Load the new model
    this.loadModel();
  }
  
  // Method to change the character model
  setCharacterPath(newPath) {
    this.characterPath = newPath;
    
    // Remove old character if it exists
    if (this.character) {
      this.scene.remove(this.character);
      this.character = null;
      
      // Reset animation manager
      this.animationManager.resetAnimations();
    }
    
    // Reset character loading state
    this.isCharacterLoaded = false;
    
    // Load the new character
    this.loadCharacter();
  }
  
  // Method to move the character
  moveCharacter(x, z) {
    if (this.character) {
      // Update character position
      this.character.position.x = x;
      this.character.position.z = z;
    }
  }
  
  // Method to rotate the character to face a direction
  rotateCharacter(angle) {
    if (this.character) {
      // Update character rotation
      this.character.rotation.y = angle;
    }
  }
}