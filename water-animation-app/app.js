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
    
    renderer.render(scene, camera);
}