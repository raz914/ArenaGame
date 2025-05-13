import * as THREE from 'three';
import { FollowCamera } from './FollowCamera.js';

export class SceneManager {
  constructor() {
    // Core components
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    
    // Utility properties
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    
    // Pointer lock state
    this.isPointerLocked = false;
    
    // Add follow camera (always active)
    this.followCamera = new FollowCamera(this.camera);
    
    console.log("SceneManager initialized");
    
    // Setup environment
    this.setupEnvironment();
    
    // Handle window resize
    this.handleResize();
    
    // Set up mouse events
    this.setupMouseEvents();
    
    // Initialize pointer lock controls
    this.setupPointerLock();
    
    // Start the animation loop
    this.animate();
  }
  
  createScene() {
    const scene = new THREE.Scene();
    
    // Load environment map for realistic reflections
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('./assets/hdr/hdr_3.jpg', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = texture;
      
      // You can keep these settings
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    });
    
    return scene;
  }
  
  createCamera() {
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 5);
    return camera;
  }
  
  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add the renderer to the DOM
    document.body.appendChild(renderer.domElement);
    return renderer;
  }
  
  setupEnvironment() {
    // Add lights
    this.addLights();
    
    // Add grid helper (optional - helps with orientation)
    // const gridHelper = new THREE.GridHelper(100, 100);
    // this.scene.add(gridHelper);
  }
  
  addLights() {
    // Ambient light for general illumination - reduced intensity for more contrast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    
    // Main directional light (sun) with enhanced shadows
    const mainLight = new THREE.DirectionalLight(0xfffaf0, 1.5); // Warm sunlight color
    mainLight.position.set(50, 100, 50); // Higher position for more overhead sun effect
    mainLight.castShadow = true;
    
    // Enhanced shadow properties for better quality
    mainLight.shadow.mapSize.width = 4096; // Increased resolution
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    
    // Softer shadows
    mainLight.shadow.radius = 2;
    mainLight.shadow.bias = -0.0001;
    
    this.scene.add(mainLight);
    
    // Add a subtle fill light from the opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 30, -50);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 2048;
    fillLight.shadow.mapSize.height = 2048;
    this.scene.add(fillLight);
    
    // Add a subtle rim light for better character definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 20, -50);
    this.scene.add(rimLight);
  }
  
  // Update camera to follow character
  updateFollowCamera(characterPosition, characterRotation) {
    this.followCamera.update(characterPosition, characterRotation);
  }
  
  handleResize() {
    window.addEventListener('resize', () => {
      // Update camera
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // Update renderer
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  setupPointerLock() {
    const canvas = this.renderer.domElement;
    
    // Pointer lock event listeners
    document.addEventListener('click', () => {
      // Request pointer lock when canvas is clicked
      if (!this.isPointerLocked) {
        canvas.requestPointerLock();
      }
    });
    
    // Track pointer lock state changes
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        this.isPointerLocked = true;
        console.log('Pointer locked');
      } else {
        this.isPointerLocked = false;
        console.log('Pointer lock released');
      }
      
      // Update follow camera pointer lock state
      if (this.followCamera) {
        this.followCamera.setPointerLocked(this.isPointerLocked);
      }
    });
    
    // Handle error
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock error');
    });
  }
  
  setupMouseEvents() {
    window.addEventListener('mousemove', (event) => {
      // Calculate normalized mouse coordinates
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Mouse interaction logic can be added here
    });
    
    window.addEventListener('click', (event) => {
      // Click interaction logic can be added here
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Adjust initial camera position (used when first loading the scene)
  updateCameraForModel(center, size) {
    // Adjust camera to frame model
    const distance = size.length() * 1.5;
    this.camera.position.set(
      distance,
      distance * 0.5,
      distance
    );
  }
}