// Example of how to position buildings from assets/models/buildings folder

document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure the game is fully initialized and buildings are loaded
  setTimeout(() => {
    // Access the global game instance
    const game = window.game;
    
    if (!game || !game.environmentManager) {
      console.error('Game or EnvironmentManager not available');
      return;
    }
    
    // Create a town layout with the buildings
    console.log('Setting up town layout...');
    
    // Town center with Town Hall
    game.environmentManager.setPosition('Town_Hall', 0, 0, 0);
    game.environmentManager.setRotation('Town_Hall', 0, Math.PI / 2, 0); // Face 90 degrees
    game.environmentManager.setScale('Town_Hall', 1, 1, 1);
    
    // Marketplace in front of town hall
    game.environmentManager.setPosition('Marketplace', 0, 0, 20);
    
    // Religious buildings
    game.environmentManager.setPosition('G_Angel_Altar', 15, 0, -15);
    game.environmentManager.setPosition('Templa', -15, 0, -15);
    game.environmentManager.setPosition('Templa_3', -25, 0, -15);
    
    // Entertainment district
    game.environmentManager.setPosition('Theater', 25, 0, 10);
    game.environmentManager.setPosition('Coliseum', 35, 0, 25);
    game.environmentManager.setPosition('Tavern', 15, 0, 15);
    
    // Housing area
    game.environmentManager.setPosition('Home', -15, 0, 15);
    
    // Basic services
    game.environmentManager.setPosition('Bakery', -25, 0, 25);
    game.environmentManager.setPosition('Butcher', -25, 0, 10);
    game.environmentManager.setPosition('small_hospital', -15, 0, 25);
    
    // Resources and production
    game.environmentManager.setPosition('Wheat_Farm', 30, 0, -20);
    game.environmentManager.setPosition('Grape_Farm', 30, 0, -30);
    game.environmentManager.setPosition('Woodcutter_house', -30, 0, -30);
    game.environmentManager.setPosition('Gold_mine', 40, 0, -40);
    game.environmentManager.setPosition('Marble_Mine_1', 50, 0, -40);
    game.environmentManager.setPosition('Iron_mide', 40, 0, -50);
    
    // Decorative & functional structures
    game.environmentManager.setPosition('Arch', 0, 0, 40);
    game.environmentManager.setPosition('Warehouse', -30, 0, 30);
    game.environmentManager.setPosition('fishing_club', -20, 0, 40);
    
    // Defensive structures
    game.environmentManager.setPosition('WatchTower', -50, 0, 0);
    game.environmentManager.setPosition('WatchTower', 50, 0, 0);
    game.environmentManager.setPosition('WatchTower', 0, 0, 50);
    game.environmentManager.setPosition('WatchTower', 0, 0, -50);
    
    console.log('Town layout complete');
    
    // Add keyboard shortcut to reset all building positions and make them visible
    document.addEventListener('keydown', (event) => {
      // Press 'R' to reset/show all buildings
      if (event.key === 'r' || event.key === 'R') {
        resetBuildingPositions(game);
      }
      
      // Press 'G' to organize buildings in a grid layout
      if (event.key === 'g' || event.key === 'G') {
        organizeInGrid(game);
      }
      
      // Press 'C' to organize buildings in a circle layout
      if (event.key === 'c' || event.key === 'C') {
        organizeInCircle(game);
      }
    });
    
    // Show controls in console
    console.log('Building Layout Controls:');
    console.log('Press R to reset buildings to origin');
    console.log('Press G to organize buildings in a grid');
    console.log('Press C to organize buildings in a circle');
    
  }, 5000); // Wait 5 seconds for buildings to load
});

// Function to reset all building positions
function resetBuildingPositions(game) {
  const buildingIds = game.environmentManager.getBuildingIds();
  console.log('Resetting building positions...');
  
  // Position all buildings at origin but spread them out slightly
  buildingIds.forEach((id, index) => {
    const angle = index * (Math.PI * 2 / buildingIds.length);
    const distance = 5;
    const x = Math.sin(angle) * distance;
    const z = Math.cos(angle) * distance;
    
    game.environmentManager.setPosition(id, x, 0, z);
    game.environmentManager.setRotation(id, 0, angle, 0);
    game.environmentManager.setScale(id, 1, 1, 1);
  });
  
  console.log('Building positions reset');
}

// Function to organize buildings in a grid layout
function organizeInGrid(game) {
  const buildingIds = game.environmentManager.getBuildingIds();
  console.log('Organizing buildings in grid layout...');
  
  const gridSize = Math.ceil(Math.sqrt(buildingIds.length));
  const spacing = 20;
  
  buildingIds.forEach((id, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    const x = (col - gridSize/2) * spacing;
    const z = (row - gridSize/2) * spacing;
    
    game.environmentManager.setPosition(id, x, 0, z);
    game.environmentManager.setRotation(id, 0, 0, 0);
  });
  
  console.log('Buildings organized in grid layout');
}

// Function to organize buildings in a circle layout
function organizeInCircle(game) {
  const buildingIds = game.environmentManager.getBuildingIds();
  console.log('Organizing buildings in circle layout...');
  
  const radius = 50;
  
  buildingIds.forEach((id, index) => {
    const angle = index * (Math.PI * 2 / buildingIds.length);
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    
    game.environmentManager.setPosition(id, x, 0, z);
    // Make buildings face center
    game.environmentManager.setRotation(id, 0, angle + Math.PI, 0);
  });
  
  console.log('Buildings organized in circle layout');
} 