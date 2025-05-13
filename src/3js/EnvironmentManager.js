import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
    this.buildings = new Map(); // Store buildings with their IDs
    this.gltfLoader = null;
    this.dracoLoader = null;
    
    // Setup loaders
    this.setupLoaders();
  }
  
  setupLoaders() {
    // Create loading manager
    this.loadingManager = new THREE.LoadingManager();
    
    // Setup loading manager callbacks
    this.loadingManager.onLoad = () => {
      console.log('All environment models loaded successfully!');
    };
    
    this.loadingManager.onError = (url) => {
      console.error('Error loading environment resource:', url);
    };
    
    // Create GLTF loader
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    
    // Setup Draco compression support
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }
  
  /**
   * Load a building model from assets folder
   * @param {string} id - Unique identifier for the building
   * @param {string} modelPath - Path to the model file
   * @param {function} callback - Optional callback function called when model is loaded
   */
  loadBuilding(id, modelPath, callback) {
    console.log(`Loading building model from: ${modelPath}`);
    
    this.gltfLoader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Add model to scene
        this.scene.add(model);
        
        // Store building reference
        this.buildings.set(id, model);
        
        console.log(`Building ${id} loaded successfully`);
        
        // Call optional callback with the loaded model
        if (callback && typeof callback === 'function') {
          callback(model);
        }
      },
      // Progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(`Building ${id} loading: ${Math.round(percentComplete)}%`);
      },
      // Error callback
      (error) => {
        console.error(`Error loading building ${id}:`, error);
      }
    );
  }
  
  /**
   * Load multiple building models at once
   * @param {Array} buildingsConfig - Array of building configs with {id, path} properties
   */
  loadBuildings(buildingsConfig) {
    buildingsConfig.forEach(config => {
      this.loadBuilding(config.id, config.path);
    });
  }
  
  /**
   * Set position of a building
   * @param {string} id - Building identifier
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @returns {boolean} - Success status
   */
  setPosition(id, x, y, z) {
    const building = this.buildings.get(id);
    if (!building) {
      console.warn(`Building with id ${id} not found`);
      return false;
    }
    
    building.position.set(x, y, z);
    return true;
  }
  
  /**
   * Set rotation of a building
   * @param {string} id - Building identifier
   * @param {number} x - X rotation in radians
   * @param {number} y - Y rotation in radians
   * @param {number} z - Z rotation in radians
   * @returns {boolean} - Success status
   */
  setRotation(id, x, y, z) {
    const building = this.buildings.get(id);
    if (!building) {
      console.warn(`Building with id ${id} not found`);
      return false;
    }
    
    building.rotation.set(x, y, z);
    return true;
  }
  
  /**
   * Set scale of a building
   * @param {string} id - Building identifier
   * @param {number} x - X scale
   * @param {number} y - Y scale
   * @param {number} z - Z scale
   * @returns {boolean} - Success status
   */
  setScale(id, x, y, z) {
    const building = this.buildings.get(id);
    if (!building) {
      console.warn(`Building with id ${id} not found`);
      return false;
    }
    
    building.scale.set(x, y, z);
    return true;
  }
  
  /**
   * Remove a building from the scene
   * @param {string} id - Building identifier
   * @returns {boolean} - Success status
   */
  removeBuilding(id) {
    const building = this.buildings.get(id);
    if (!building) {
      console.warn(`Building with id ${id} not found`);
      return false;
    }
    
    this.scene.remove(building);
    this.buildings.delete(id);
    return true;
  }
  
  /**
   * Get a building by its ID
   * @param {string} id - Building identifier
   * @returns {THREE.Group|null} - The building object or null if not found
   */
  getBuilding(id) {
    return this.buildings.get(id) || null;
  }
  
  /**
   * Get all building IDs
   * @returns {Array} - Array of building IDs
   */
  getBuildingIds() {
    return Array.from(this.buildings.keys());
  }
} 