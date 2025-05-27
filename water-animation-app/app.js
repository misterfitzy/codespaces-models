import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Initialize variables
let container, scene, camera, renderer, water, controls;
let mousePosition = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let waterMesh;
let backgroundTexture, backgroundMesh;
let clock = new THREE.Clock();
let lastRippleTime = 0;
let distortionScale = 3.7;
let waterSize = 500;
let rippleStrength = 3;

// Boat variables
let boat, fisherman, fishingRod, fishingLine;
let boatSpeed = 0.5;
let boatDirection = new THREE.Vector3(1, 0, 1).normalize();
let isFishing = false;
let fishingTimer = 0;
let fishingDuration = 10; // Fishing duration in seconds
let movementDuration = 15; // Movement duration in seconds
let movementTimer = 0;

// DOM elements
const distortionInput = document.getElementById('distortion-scale');
const waterSizeInput = document.getElementById('water-size');
const rippleStrengthInput = document.getElementById('ripple-strength');
const distortionValue = document.getElementById('distortion-value');
const sizeValue = document.getElementById('size-value');
const rippleValue = document.getElementById('ripple-value');
const imageInput = document.getElementById('background-image');

// Initialize Three.js scene
init();

// Create a 3D boat model
function createBoat() {
    // Create a group for the boat and all its parts
    const boatGroup = new THREE.Group();
    
    // Create boat hull
    const hullGeometry = new THREE.BoxGeometry(10, 3, 20);
    const hullMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x885511,
        roughness: 0.7, 
        metalness: 0.2 
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 1;
    boatGroup.add(hull);
    
    // Add boat details - deck
    const deckGeometry = new THREE.BoxGeometry(8, 1, 16);
    const deckMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xaa7744, 
        roughness: 0.6,
        metalness: 0.1
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 3;
    boatGroup.add(deck);
    
    // Add cabin
    const cabinGeometry = new THREE.BoxGeometry(6, 4, 8);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xddaa77,
        roughness: 0.5,
        metalness: 0.1
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 5.5;
    cabin.position.z = -2;
    boatGroup.add(cabin);
    
    // Add boat nose (front part)
    const noseGeometry = new THREE.ConeGeometry(5, 8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
        color: 0x885511,
        roughness: 0.7,
        metalness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.z = 12;
    nose.position.y = 1;
    nose.rotation.x = Math.PI / 2;
    boatGroup.add(nose);
    
    return boatGroup;
}

// Create a fisherman
function createFisherman() {
    const fishermanGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.7, 3, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3366aa });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    fishermanGroup.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffbb99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.5;
    fishermanGroup.add(head);
    
    // Hat
    const hatGeometry = new THREE.ConeGeometry(1, 1, 8);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x334455 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 4.2;
    fishermanGroup.add(hat);
    
    // Create fishing rod
    const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
    const rodMaterial = new THREE.MeshStandardMaterial({ color: 0x663300 });
    fishingRod = new THREE.Mesh(rodGeometry, rodMaterial);
    fishingRod.position.set(2, 3, 0);
    fishingRod.rotation.z = -0.3;
    fishermanGroup.add(fishingRod);
    
    // Create fishing line
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Line starts at the end of the fishing rod
    const lineStart = new THREE.Vector3(0, 4, 0);
    const lineEnd = new THREE.Vector3(0, -5, 0);
    lineGeometry.setFromPoints([lineStart, lineEnd]);
    
    fishingLine = new THREE.Line(lineGeometry, lineMaterial);
    fishingLine.position.x = 4;
    fishingLine.position.y = 0;
    fishingLine.visible = false; // Initially hidden
    fishermanGroup.add(fishingLine);
    
    return fishermanGroup;
}

// Create ripple effect at the mouse position
function createRipple(x, y) {
    // Skip ripple creation if called too frequently
    const currentTime = clock.getElapsedTime();
    if (currentTime - lastRippleTime < 0.1) return;
    lastRippleTime = currentTime;

    const waterUniforms = water.material.uniforms;
    if (waterUniforms.ripples) {
        // Add a new ripple
        waterUniforms.ripples.value.push({
            position: new THREE.Vector3(x, 0, y),
            strength: rippleStrength,
            radius: 0.1,
            time: currentTime
        });

        // Remove old ripples if there are too many
        if (waterUniforms.ripples.value.length > 20) {
            waterUniforms.ripples.value.shift();
        }
    }
}

// Handle mouse movement over water
function onMouseMove(event) {
    // Calculate normalized coordinates
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycasting to find intersection with water
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObject(waterMesh);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        createRipple(intersect.point.x, intersect.point.z);
    }
}

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Scene initialization
function init() {
    // Get container
    container = document.getElementById('water-container');

    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(0, 30, 100);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Create sun
    const sun = new THREE.Vector3();

    // Add sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    scene.environment = pmremGenerator.fromScene(sky).texture;

    // Create water
    const waterGeometry = new THREE.PlaneGeometry(waterSize, waterSize);
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
                function(texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: distortionScale,
            fog: scene.fog !== undefined
        }
    );
    water.position.y = 0;
    water.rotation.x = -Math.PI / 2;
    
    // Add custom property to track ripples
    water.material.uniforms.ripples = { value: [] };
    
    scene.add(water);
    waterMesh = water.mesh || water; // Store water mesh for raycasting

    // Create default background under the water
    const textureLoader = new THREE.TextureLoader();
    backgroundTexture = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg',
        function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
        }
    );
    
    const backgroundGeometry = new THREE.PlaneGeometry(waterSize * 1.5, waterSize * 1.5);
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
    backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.y = -5;
    backgroundMesh.rotation.x = -Math.PI / 2;
    scene.add(backgroundMesh);

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 0, 0);
    controls.minDistance = 40;
    controls.maxDistance = 200;
    controls.update();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    container.addEventListener('mousemove', onMouseMove);
    
    // Control event listeners
    distortionInput.addEventListener('input', function() {
        distortionScale = parseFloat(this.value);
        distortionValue.textContent = distortionScale;
        water.material.uniforms.distortionScale.value = distortionScale;
    });

    waterSizeInput.addEventListener('input', function() {
        waterSize = parseFloat(this.value);
        sizeValue.textContent = waterSize;
        
        // Update water geometry
        scene.remove(water);
        const newWaterGeometry = new THREE.PlaneGeometry(waterSize, waterSize);
        water = new Water(
            newWaterGeometry,
            water.material.options
        );
        water.position.y = 0;
        water.rotation.x = -Math.PI / 2;
        water.material.uniforms.ripples = { value: [] };
        scene.add(water);
        waterMesh = water.mesh || water;
        
        // Update background size
        scene.remove(backgroundMesh);
        const newBackgroundGeometry = new THREE.PlaneGeometry(waterSize * 1.5, waterSize * 1.5);
        backgroundMesh = new THREE.Mesh(newBackgroundGeometry, backgroundMesh.material);
        backgroundMesh.position.y = -5;
        backgroundMesh.rotation.x = -Math.PI / 2;
        scene.add(backgroundMesh);
    });

    rippleStrengthInput.addEventListener('input', function() {
        rippleStrength = parseFloat(this.value);
        rippleValue.textContent = rippleStrength;
    });

    // Handle image upload
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                // Create new texture from uploaded image
                const newTexture = new THREE.TextureLoader().load(event.target.result);
                newTexture.wrapS = newTexture.wrapT = THREE.RepeatWrapping;
                
                // Update background material
                scene.remove(backgroundMesh);
                const backgroundMaterial = new THREE.MeshBasicMaterial({ map: newTexture });
                backgroundMesh = new THREE.Mesh(backgroundMesh.geometry, backgroundMaterial);
                backgroundMesh.position.y = -5;
                backgroundMesh.rotation.x = -Math.PI / 2;
                scene.add(backgroundMesh);
            };
            reader.readAsDataURL(file);
        }
    });

    // Create and add boat
    boat = createBoat();
    boat.position.set(0, 1.5, 0);
    scene.add(boat);
    
    // Create and add fisherman
    fisherman = createFisherman();
    fisherman.position.set(0, 3, 0);
    boat.add(fisherman);
    
    // Start animation loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update water
    const time = performance.now() * 0.001;
    water.material.uniforms.time.value = time;
    
    // Update ripples
    if (water.material.uniforms.ripples && water.material.uniforms.ripples.value.length > 0) {
        const currentTime = clock.getElapsedTime();
        water.material.uniforms.ripples.value.forEach((ripple, i) => {
            // Expand ripple radius over time
            const age = currentTime - ripple.time;
            ripple.radius = Math.min(20, age * 10); // Limit max radius
            
            // Reduce strength over time
            ripple.strength *= 0.98;
            
            // Remove old ripples
            if (ripple.strength < 0.05) {
                water.material.uniforms.ripples.value.splice(i, 1);
            }
        });
    }
    
    // Update boat and fishing state
    updateBoat();
    
    renderer.render(scene, camera);
}

// Update boat position and fishing state
function updateBoat() {
    const deltaTime = clock.getDelta();
    
    if (isFishing) {
        // Update fishing timer
        fishingTimer += deltaTime;
        
        // Animate fishing line bobbing
        if (fishingLine && fishingLine.visible) {
            const lineGeometry = fishingLine.geometry;
            const positions = lineGeometry.getAttribute('position').array;
            positions[5] = -5 + Math.sin(performance.now() * 0.003) * 0.5; // Move the end point up and down
            lineGeometry.getAttribute('position').needsUpdate = true;
            
            // Create occasional water ripples at the fishing line end
            if (Math.random() < 0.02) {
                const lineEndX = boat.position.x + 4;
                const lineEndZ = boat.position.z;
                createRipple(lineEndX, lineEndZ);
            }
        }
        
        // Check if fishing duration has passed
        if (fishingTimer >= fishingDuration) {
            // Stop fishing and make the boat move again
            isFishing = false;
            fishingTimer = 0;
            movementTimer = 0;
            
            // Hide the fishing line
            if (fishingLine) {
                fishingLine.visible = false;
            }
            
            // Reset direction for next movement phase
            const angle = Math.random() * Math.PI * 2;
            boatDirection.x = Math.cos(angle);
            boatDirection.z = Math.sin(angle);
            boatDirection.normalize();
        }
    } else {
        // Boat is moving
        movementTimer += deltaTime;
        
        // Move the boat
        const moveX = boatDirection.x * boatSpeed * deltaTime;
        const moveZ = boatDirection.z * boatSpeed * deltaTime;
        boat.position.x += moveX;
        boat.position.z += moveZ;
        
        // Orient the boat in the direction of movement
        if (moveX !== 0 || moveZ !== 0) {
            boat.lookAt(boat.position.x + boatDirection.x, boat.position.y, boat.position.z + boatDirection.z);
        }
        
        // Create ripples as the boat moves
        if (Math.random() < 0.1) {
            createRipple(boat.position.x - (boatDirection.x * 8), boat.position.z - (boatDirection.z * 8)); // Create ripples behind the boat
        }
        
        // Keep boat within water boundaries
        const maxDistance = waterSize / 2 - 15;
        if (Math.abs(boat.position.x) > maxDistance || Math.abs(boat.position.z) > maxDistance) {
            // Reverse direction if getting too close to the edge
            boatDirection.x *= -1;
            boatDirection.z *= -1;
            boat.lookAt(boat.position.x + boatDirection.x, boat.position.y, boat.position.z + boatDirection.z);
        }
        
        // Check if movement duration has passed
        if (movementTimer >= movementDuration) {
            // Start fishing
            isFishing = true;
            fishingTimer = 0;
            
            // Show the fishing line
            if (fishingLine) {
                fishingLine.visible = true;
            }
        }
    }
}