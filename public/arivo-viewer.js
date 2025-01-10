// Import Three.js from CDN
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/RGBELoader.js';

// Create scene, camera and renderer
const scene = new THREE.Scene();
const canvas = document.getElementById('arivo-canvas');
const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;

// Adjust FOV for better fit
const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true 
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Setup renderer with proper size

if (canvas) {
    renderer.setSize(canvasWidth, canvasHeight);

    // Update camera aspect ratio
    camera.aspect = canvasWidth/ canvasHeight;
    camera.updateProjectionMatrix();
    
    // Add window resize handler
    window.addEventListener('resize', function() {
        renderer.setSize(canvasWidth, canvasHeight);
        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
    });
} else {
    console.error('Could not find element with id "arivo-canvas"');
}

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.autoRotate = false; // başlangıçta kapalı
controls.autoRotateSpeed = 2.0; // rotasyon hızı

// Position camera
camera.position.z = 10;

// Add HDR environment map
new RGBELoader()
    .load('https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/studio02-b.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        const colorBG = new THREE.Color(1, 1, 1);
        scene.background = colorBG; // Optional: use HDR as background
    });

// Get DOM elements
const loadingOverlay = document.getElementById('loading-overlay');

// Load GLTF model
const loader = new GLTFLoader();

// Get dimension labels container and labels
const dimensionsContainer = document.getElementById('dimensions-container');
const widthLabel = document.getElementById('width-label');
const heightLabel = document.getElementById('height-label');
const depthLabel = document.getElementById('depth-label');
const heightLabelMinus = document.getElementById('height-labelMinus');
const depthLabelMinus = document.getElementById('depth-labelMinus');

// Model URL'sini global bir değişken olarak tanımla
const MODEL_URL = 'https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/kmtl-246.glb';

//https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/kmtl-164.glb
//
loader.load(
    MODEL_URL,  // URL'yi buradan kullan
    function (gltf) {
        // Hide loading overlay when model is loaded
        loadingOverlay.style.display = 'none';
        
        scene.add(gltf.scene);
        
        // Bounding box hesaplama
        const box = new THREE.Box3();
        box.setFromObject(gltf.scene);
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Bounding box görselleştirmesi
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true,
            opacity: 0.8,
            transparent: true
        });
        const boundingBoxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boundingBoxMesh.position.copy(center);
        //scene.add(boundingBoxMesh);

        // Kamera pozisyonunu modelin boyutuna göre ayarla
        const fov = 45;
        const aspect = canvasWidth / canvasHeight;
        const vFov = (fov * Math.PI) / 180;
        
        // Modelin boyutlarına göre kamera mesafesini hesapla
        const heightNeeded = Math.abs(size.y);
        const distanceForHeight = heightNeeded / (2 * Math.tan(vFov / 2));
        
        const widthNeeded = Math.abs(size.x);
        const distanceForWidth = widthNeeded / (2 * Math.tan((vFov * aspect) / 2));
        
        // En büyük mesafeyi kullan ve %20 margin ekle
        const distance = Math.max(distanceForHeight, distanceForWidth) * 1.2;

        // Kamerayı pozisyonla
        camera.position.set(distance, distance * 0.8, distance);
        camera.lookAt(center);
        
        // Kontrolleri merkeze ayarla
        controls.target.copy(center);
        controls.minDistance = distance * 0.5;
        controls.maxDistance = distance * 2;
        controls.update();

        // Add dimension labels functionality
        let dimensionLabels = [];
        
        dimensionsButton.addEventListener('click', () => {
            if (dimensionsButton.innerHTML === 'Show Dimensions') {
                // Orijinal boyutları kullan
                const originalSize = size.clone();

                // Update label contents
                widthLabel.textContent = `${(originalSize.x * 100).toFixed(1)} cm`;
                heightLabel.textContent = `${(originalSize.y * 100).toFixed(1)} cm`;
                depthLabel.textContent = `${(originalSize.z * 100).toFixed(1)} cm`;
                heightLabelMinus.textContent = `${(originalSize.y * 100).toFixed(1)} cm`;
                depthLabelMinus.textContent = `${(originalSize.z * 100).toFixed(1)} cm`;
                
                dimensionsContainer.style.display = 'block';

                // Update label positions on each frame
                function updateLabelPositions() {
                    // Bounding box'ın köşe noktaları
                    const min = box.min;
                    const max = box.max;
                    const center = box.getCenter(new THREE.Vector3());

                    // Label pozisyonlarını bounding box kenarlarına yerleştir
                    const widthPos = new THREE.Vector3(center.x, max.y + 0.02, min.z);                  
                    const heightPos = new THREE.Vector3(max.x + 0.02, center.y, min.z);
                    const depthPos = new THREE.Vector3(max.x + 0.02, min.y, center.z);
                    const heightPosMinus = new THREE.Vector3(min.x - 0.02, center.y, min.z);
                    const depthPosMinus = new THREE.Vector3(min.x - 0.02, min.y, center.z);

                    // Kamera pozisyonundan merkeze doğru vektör
                    const cameraDirection = new THREE.Vector3().subVectors(camera.position, center).normalize();

                    // Normal vektörler (etiketlerin yönleri)
                    const rightNormal = new THREE.Vector3(1, 0, 0);
                    const leftNormal = new THREE.Vector3(-1, 0, 0);

                    // Dot product hesapla
                    const rightDot = cameraDirection.dot(rightNormal);
                    const leftDot = cameraDirection.dot(leftNormal);

                    // Tolerans değerleri
                    const minThreshold = -0.05;  // Tamamen kaybolma eşiği
                    const maxThreshold = 0.05;   // Tamamen görünür olma eşiği

                    // Görünürlük oranını hesapla (0 ile 1 arasında)
                    const rightSideVisible = rightDot > maxThreshold ? true : 
                                           rightDot < minThreshold ? false :
                                           (rightDot - minThreshold) / (maxThreshold - minThreshold);

                    const leftSideVisible = leftDot > maxThreshold ? true :
                                          leftDot < minThreshold ? false :
                                          (leftDot - minThreshold) / (maxThreshold - minThreshold);

                    // Label pozisyonlarını güncelle
                    [
                        { pos: widthPos, label: widthLabel },
                        { pos: heightPos, label: heightLabel, side: 'right' },
                        { pos: depthPos, label: depthLabel, side: 'right' },
                        { pos: heightPosMinus, label: heightLabelMinus, side: 'left' },
                        { pos: depthPosMinus, label: depthLabelMinus, side: 'left' }
                    ].forEach(({ pos, label, side }) => {
                        pos.project(camera);
                        
                        const x = (pos.x * 0.5 + 0.5) * canvas.clientWidth;
                        const y = (-pos.y * 0.5 + 0.5) * canvas.clientHeight;
                        
                        label.style.left = `${x}px`;
                        label.style.top = `${y}px`;
                        
                        if (pos.z > 1) {
                            label.style.display = 'none';
                        } else {
                            // Width label için özel kontrol
                            if (label === widthLabel) {
                                // Kameranın y ekseni açısını kontrol et
                                const cameraVerticalAngle = Math.atan2(camera.position.y - center.y, 
                                    Math.sqrt(Math.pow(camera.position.x - center.x, 2) + Math.pow(camera.position.z - center.z, 2)));
                                
                                // Sadece alt açı için tolerans
                                const minVerticalAngle = -0.9; // yaklaşık -50 derece
                                
                                if (cameraVerticalAngle < minVerticalAngle) {
                                    label.style.display = 'none';
                                } else if (cameraVerticalAngle < 0) {
                                    // Sadece negatif açılar için yumuşak geçiş
                                    const opacity = 1 - (cameraVerticalAngle / minVerticalAngle);
                                    label.style.display = 'block';
                                    label.style.opacity = Math.max(0, Math.min(1, opacity));
                                } else {
                                    // Pozitif açılarda (yukarıdan bakış) her zaman görünür
                                    label.style.display = 'block';
                                    label.style.opacity = 1;
                                }
                            } else {
                                const visibility = side === 'right' ? rightSideVisible : leftSideVisible;
                                
                                if (typeof visibility === 'boolean') {
                                    label.style.display = visibility ? 'block' : 'none';
                                } else {
                                    label.style.display = 'block';
                                    label.style.opacity = visibility;
                                }
                            }
                        }
                    });

                    requestAnimationFrame(updateLabelPositions);
                }

                updateLabelPositions();
                dimensionsButton.innerHTML = 'Hide Dimensions';
            } else {
                dimensionsContainer.style.display = 'none';
                dimensionsButton.innerHTML = 'Show Dimensions';
            }
        });

        // Add some lights to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(0, 20, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.bias = 0.05;
        directionalLight.shadow.normalBias = 0.02;
        directionalLight.shadow.radius = 10;
        scene.add(directionalLight);

        // Ground plane için ShadowMaterial kullanalım
        const groundGeometry = new THREE.PlaneGeometry(size.x * 2, size.z * 2);
        const groundMaterial = new THREE.ShadowMaterial({
            opacity: 0.5
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Enable shadow casting for model
        gltf.scene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });



        // Log to confirm model is loaded
        console.log('Model loaded successfully');
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        // Hide loading overlay and show error message if loading fails
        loadingOverlay.style.display = 'none';
        console.error('An error occurred loading the model:', error);
        // Optionally show error message to user
        alert('Failed to load 3D model. Please try refreshing the page.');
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Auto-rotate butonu için event listener ekle
const autoRotateButton = document.getElementById('autoRotateButton');
autoRotateButton.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    autoRotateButton.innerHTML = controls.autoRotate ? 'Stop Rotation' : 'Auto Rotate';
});

// AR View butonu için event listener
const viewArButton = document.getElementById('viewArButton');
const arViewer = document.getElementById('ar-viewer');

viewArButton.addEventListener('click', function() {
    arViewer.src = MODEL_URL;
    
    // Kısa bir gecikme ile AR'ı başlat
    setTimeout(() => {
        arViewer.activateAR();
    }, 100);
});


