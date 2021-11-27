import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import { BufferAttribute, MeshToonMaterial, NearestFilter } from 'three';
import gsap from 'gsap';

/**
 * Debug
 */
const gui = new dat.GUI()

const parameters = {
    materialColor: '#59d2f3',
    particleColor: '#f4afba'
}

gui
    .addColor(parameters, 'materialColor')
    .onChange(() => {
        material.color.set(parameters.materialColor);
    });

gui
    .addColor(parameters, 'particleColor')
    .onChange(() => {
        particlesMaterial.color.set(parameters.particleColor);
    });

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load('textures/gradients/5.jpg');
const particleTexture = textureLoader.load('textures/twirl_01.png');
// gradientTexture.magFilter = THREE.NearestFilter;

// Material
const material = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture,
});


/**
 * Objects
 */

const objectsDistance = 4;

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
);
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
);
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
);

mesh1.position.y = - objectsDistance * 0;
mesh1.position.x = 2;
mesh2.position.y = - objectsDistance * 1;
mesh2.position.x = - 2;
mesh3.position.y = - objectsDistance * 2;
mesh3.position.x = 2;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [
    mesh1, mesh2, mesh3
];

// particles

const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (objectsDistance * 0.5) - (Math.random() * objectsDistance * sectionMeshes.length);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
};

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
);

// particle material
const particlesMaterial = new THREE.PointsMaterial({
    color: parameters.particleColor,
    transparent: true,
    alphaMap: particleTexture,
    alphaTest: 0.001,
    sizeAttenuation: true,
    size: 0.1
});

// particle point
const particles = new THREE.Points(
    particlesGeometry,
    particlesMaterial
);
scene.add(particles);

// Light

const directionalLight = new THREE.DirectionalLight(
    0xaae1d8, 1
);
directionalLight.position.set(1, 1, 0);

scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// camera group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// scroll
let scrollY = window.scrollY;
let currentSection = 0;


window.addEventListener('scroll', () => {
    scrollY = window.scrollY;

    const newSection = Math.round(scrollY / sizes.height);

    if(newSection != currentSection) {
        currentSection = newSection;

        gsap.to(
            sectionMeshes[currentSection].rotation, {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3',
                z: '+=1.5'
            }
        );
    };
});

// cursor

const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX / sizes.width - 0.5;
    cursor.y = e.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // animate meshes
    for(const mesh of sectionMeshes) {
        mesh.rotation.x += deltaTime * Math.sin(0.1);
        mesh.rotation.y += deltaTime * Math.cos(5);
        mesh.rotation.z += deltaTime * Math.sin(1);
    }

    // animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance;

    const parallaxX = cursor.x;
    const parallaxY = - cursor.y;
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 1.2 * deltaTime;
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 1.2 * deltaTime;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()