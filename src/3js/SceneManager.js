import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor() {
    // Core components
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    
    // Utility properties
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.controls = null;
    
    console.log("SceneManager initialized");
    
    // Setup environment
    this.setupEnvironment();
    
    // Add orbit controls
    this.setupControls();
    
    // Handle window resize
    this.handleResize();
    
    // Set up mouse events
    this.setupMouseEvents();
    
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
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
  }
  
  addLights() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    
    // Configure shadow properties
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    
    this.scene.add(mainLight);
    
    // Additional lights for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    
    // Add a soft point light
    const pointLight = new THREE.PointLight(0xffffcc, 0.8, 20);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }
  
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation
    
    // Set initial control target
    this.controls.target.set(0, 0, 0);
    this.controls.update();
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
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Add a method to update camera and controls based on model
  updateCameraForModel(center, size) {
    // Update controls target based on model center
    this.controls.target.set(0, size.y / 4, 0); // Target slightly above the base
    this.controls.update();
    
    // Adjust camera to frame model
    const distance = size.length() * 1.5;
    this.camera.position.set(
      distance,
      distance * 0.5,
      distance
    );
  }
}