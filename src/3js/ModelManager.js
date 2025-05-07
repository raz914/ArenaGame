import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class ModelLoader {
  constructor(scene, updateCameraCallback) {
    this.scene = scene;
    this.updateCameraCallback = updateCameraCallback;
    this.modelPath = "./assets/models/ground.glb"; // Default model path
    
    // Model-related properties
    this.mixer = null;
    this.model = null;
    this.isModelLoaded = false;
    this.loadingManager = null;
    this.loaderOverlay = null;
    this.loaderPercentage = null;
    this.progressBar = null;
    
    console.log("ModelLoader initialized with model path:", this.modelPath);
    
    // Ensure loader is visible during model loading
    this.setupLoader();
    
    // Load the model
    this.loadModel();
  }
  
  setupLoader() {
    // Create loading manager for progress tracking
    this.loadingManager = new THREE.LoadingManager();
    
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
    // Create GLTF loader
    const gltfLoader = new GLTFLoader(this.loadingManager);
    
    // Setup Draco compression support
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    gltfLoader.setDRACOLoader(dracoLoader);
    
    // Load the model
    gltfLoader.load(
      this.modelPath,
      (gltf) => {
        // Store the model
        this.model = gltf.scene;
        
        // Center and scale the model
        this.processModel(gltf);
        this.model.scale.set(15, 1, 15); // Reset scale to 1 for consistency
        // Add the model to the scene
        this.scene.add(this.model);
        
        // Setup animation mixer if model has animations
        // if (gltf.animations.length > 0) {
        //   this.mixer = new THREE.AnimationMixer(this.model);
          
        //   // Play all animations by default
        //   gltf.animations.forEach((clip) => {
        //     // this.mixer.clipAction(clip).play();
        //   });
        // }
      },
      (xhr) => {
        // Progress is handled by the loading manager
      },
      (error) => {
        console.error('An error occurred loading the model:', error);
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
    // if (this.mixer) {
    //   this.mixer.update(deltaTime);
    // }
  }
  
  // Method to change the model
  setModelPath(newPath) {
    this.modelPath = newPath;
    
    // Remove old model if it exists
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
      this.mixer = null;
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
}
