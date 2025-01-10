import * as THREE from 'three';
import  {GLTFLoader} from "https://unpkg.com/three@0.160.0/examples/js/loaders/GLTFLoader.js";
import {OrbitControls} from "https://unpkg.com/three@0.160.0/examples/js/controls/OrbitControls.js";
import {RGBELoader} from "https://unpkg.com/three@0.160.0/examples/js/loaders/RGBELoader.js";

let scene, camera, renderer, controls;
    // Scene oluştur
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);

    // Camera oluştur
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // Renderer oluştur
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
        document.getElementById('model-container').offsetWidth,
        document.getElementById('model-container').offsetHeight
    );
    document.getElementById('model-container').appendChild(renderer.domElement);

    // HDR loader ve environment map ekle
    new THREE.RGBELoader()
        .setPath('https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/') // HDR dosyanızın bulunduğu klasör
        .load('studio03.hdr', function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture; // Arka plan olarak da kullanmak isterseniz
        });

    // Orbit controls ekle
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // GLTF Loader ile model yükle
    const loader = new THREE.GLTFLoader();
    loader.load(
        'https://uqgrhwejkbnybsvnbauh.supabase.co/storage/v1/object/public/models-glb/kmtl-314.glb', // Model dosyanızın yolunu buraya ekleyin
        function (gltf) {
            scene.add(gltf.scene);
            
            // Modeli merkeze yerleştir
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);
            
            // Modeli uygun boyuta getir
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            gltf.scene.scale.multiplyScalar(scale);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% yüklendi');
        },
        function (error) {
            console.error('Model yüklenirken hata oluştu:', error);
        }
    );

animate();


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Pencere boyutu değiştiğinde
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
        document.getElementById('model-container').offsetWidth,
        document.getElementById('model-container').offsetHeight
    );
}

// Sayfa yüklendiğinde başlat
window.onload = init; 