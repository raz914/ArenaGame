// Example of how to use the EnvironmentManager to load and position buildings

// Wait for the game to initialize
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure the game is fully initialized
  setTimeout(() => {
    // Access the global game instance
    const game = window.game;
    
    if (!game || !game.environmentManager) {
      console.error('Game or EnvironmentManager not available');
      return;
    }
    
    // Example 1: Load a single building and position it
    game.environmentManager.loadBuilding('house1', './assets/models/house.glb', (model) => {
      // Position the building after it's loaded (callback)
      game.environmentManager.setPosition('house1', 10, 0, 10);
      game.environmentManager.setRotation('house1', 0, Math.PI / 4, 0); // 45-degree rotation
      game.environmentManager.setScale('house1', 1, 1, 1);
    });
    
    // Example 2: Load multiple buildings at once
    game.environmentManager.loadBuildings([
      { id: 'tower1', path: './assets/models/tower.glb' },
      { id: 'shop1', path: './assets/models/shop.glb' },
      { id: 'fence1', path: './assets/models/fence.glb' }
    ]);
    
    // Position them after a delay to ensure they're loaded
    setTimeout(() => {
      // Position tower
      game.environmentManager.setPosition('tower1', -15, 0, 20);
      game.environmentManager.setScale('tower1', 0.8, 1.2, 0.8); // Taller, thinner tower
      
      // Position shop
      game.environmentManager.setPosition('shop1', 5, 0, -10);
      game.environmentManager.setRotation('shop1', 0, Math.PI / 2, 0); // 90-degree rotation
      
      // Position fence as a perimeter
      const fence = game.environmentManager.getBuilding('fence1');
      if (fence) {
        // Clone the fence to create a perimeter
        for (let i = 0; i < 5; i++) {
          const fenceClone = fence.clone();
          game.sceneManager.scene.add(fenceClone);
          
          // Position in a line
          fenceClone.position.set(i * 5 - 10, 0, -20);
        }
      }
    }, 2000);
    
    // Example 3: Using the convenience methods from ArenaGame
    game.environmentManager.loadBuilding('fountain', './assets/models/fountain.glb');
    
    setTimeout(() => {
      game.positionBuilding('fountain', 0, 0, 0); // Center of the scene
      game.scaleBuilding('fountain', 1.5, 1.5, 1.5); // Make it larger
    }, 2000);
    
    // Example 4: Adding event listener to log building IDs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'b') {
        const buildingIds = game.environmentManager.getBuildingIds();
        console.log('Loaded buildings:', buildingIds);
        
        // Log positions of all buildings
        buildingIds.forEach(id => {
          const building = game.environmentManager.getBuilding(id);
          if (building) {
            console.log(`Building ${id} position:`, building.position);
          }
        });
      }
    });
  }, 3000); // Wait 3 seconds for everything to initialize
}); 