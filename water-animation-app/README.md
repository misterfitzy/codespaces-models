# Water Animation App

This web application demonstrates a realistic water animation with real-time ripple effects that respond to mouse movements. It also allows users to place custom background images under the water that are affected by refraction.

## Features

- Realistic water animation with wave simulation
- Mouse-interactive ripple effects when moving the mouse over the water
- 3D boat that moves around the water scene
- Fishing simulation with periodic boat stops
- Ability to upload custom background images that show through the water with refraction effects
- Interactive controls to adjust:
  - Water distortion scale
  - Water surface size
  - Ripple strength

## Technologies Used

- Three.js for 3D rendering and water physics
- WebGL for hardware-accelerated graphics
- ES6 JavaScript modules
- Simple Node.js server for local development

## Getting Started

1. Clone the repository
2. Navigate to the water-animation-app directory
3. Start the server:

```bash
node server.js
```

4. Open a browser and navigate to http://localhost:3000

## How to Use

- Move your mouse over the water surface to create realistic ripple effects
- Watch the boat sail around the water and periodically stop to go fishing
- Use the controls at the bottom to adjust water properties:
  - Water Distortion: Changes how much the water distorts the background image
  - Water Size: Adjusts the size of the water plane
  - Ripple Strength: Controls how intense the ripples are when interacting with the mouse
- Upload a custom background image to see it through the water with refraction effects

## Implementation Details

The water animation is implemented using Three.js with the following key components:

- Three.js Water object for realistic water simulation
- Raycasting for mouse interaction with the water surface
- Custom ripple effect implementation
- 3D boat with autonomous movement and fishing behavior
- Background image rendering with refraction
- Responsive design that works across different screen sizes

## Credits

This application uses:
- Three.js library (https://threejs.org/)
- Water normal map textures from Three.js examples